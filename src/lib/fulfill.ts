import "server-only";
import { prisma } from "./prisma";
import { consumeDeliverables, isManaged } from "./stock";

/**
 * Marks an order as DELIVERED: consumes deliverables (setting the delivered
 * content on each item), releases reserved stock, decrements manual stock for
 * non-managed items, increments sold counts, and records a Delivery.
 * Idempotent: does nothing if already delivered.
 */
export async function fulfillOrder(
  orderId: string,
  adminId: string | null,
  manual = false
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true, variant: true } }, delivery: true },
  });
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.status === "DELIVERED") return order;

  await prisma.$transaction(async (tx) => {
    for (const i of order.items) {
      const variantId = i.variantId ?? null;
      const productId = i.productId ?? i.product?.id ?? null;

      let contents: string[] = [];
      let managed = false;
      if (productId) {
        contents = await consumeDeliverables(tx, {
          productId,
          variantId,
          quantity: i.quantity,
          orderId,
        });
        managed = contents.length > 0 || (await isManaged(tx, productId, variantId));
        if (contents.length > 0) {
          await tx.orderItem.update({
            where: { id: i.id },
            data: { deliveredContent: contents.join("\n") },
          });
        }
      }

      if (i.variant) {
        await tx.productVariant.update({
          where: { id: i.variant.id },
          data: {
            reserved: Math.max(0, i.variant.reserved - i.quantity),
            soldCount: { increment: i.quantity },
            ...(managed ? {} : { stock: Math.max(0, i.variant.stock - i.quantity) }),
          },
        });
        if (i.product) {
          await tx.product.update({
            where: { id: i.product.id },
            data: { soldCount: { increment: i.quantity } },
          });
        }
      } else if (i.product) {
        await tx.product.update({
          where: { id: i.product.id },
          data: {
            reserved: Math.max(0, i.product.reserved - i.quantity),
            soldCount: { increment: i.quantity },
            ...(managed ? {} : { stock: Math.max(0, i.product.stock - i.quantity) }),
          },
        });
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } });

    if (!order.delivery) {
      await tx.delivery.create({
        data: {
          orderId,
          adminId,
          manual,
          snapshot: JSON.stringify(
            order.items.map((i) => ({
              name: i.variantName ? `${i.name} — ${i.variantName}` : i.name,
              quantity: i.quantity,
            }))
          ),
        },
      });
    }
  });

  return order;
}

/**
 * Called when a payment is confirmed (PIX webhook). Sets paidAt and:
 * - if the whole order is auto-deliverable (every item has managed deliverables
 *   and no manual-chat product) → fully delivers it automatically;
 * - otherwise → sets status PAID (team finishes via chat / manual delivery).
 * Idempotent against already paid/delivered orders.
 */
export async function markOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!order) return;

  if (order.status === "DELIVERED" || order.status === "PAID") {
    if (!order.paidAt) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paidAt: new Date() },
      });
    }
    return;
  }

  let allAuto = order.items.length > 0;
  for (const i of order.items) {
    const productId = i.productId ?? i.product?.id ?? null;
    const managed = productId
      ? await isManaged(prisma, productId, i.variantId ?? null)
      : false;
    if (!managed || i.product?.manualChat) {
      allAuto = false;
      break;
    }
  }

  if (allAuto) {
    await fulfillOrder(orderId, null, false);
    await prisma.order.update({
      where: { id: orderId },
      data: { paidAt: new Date() },
    });
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date() },
    });
  }
}
