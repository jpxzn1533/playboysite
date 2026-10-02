import "server-only";
import { prisma } from "./prisma";
import { availableCount, isManaged } from "./stock";

/**
 * Diagnoses why an order did/didn't auto-deliver. Read-only.
 */
export async function diagnoseOrder(code: string) {
  const order = await prisma.order.findFirst({
    where: { code },
    include: {
      items: { include: { product: true, variant: true } },
      delivery: true,
    },
  });
  if (!order) return { found: false, code };

  const items = [];
  let allAuto = order.items.length > 0;
  for (const i of order.items) {
    const productId = i.productId ?? i.product?.id ?? null;
    const variantId = i.variantId ?? null;
    const managed = productId ? await isManaged(prisma, productId, variantId) : false;
    const available = productId
      ? await availableCount(prisma, productId, variantId)
      : 0;
    const manualChat = i.product?.manualChat ?? false;
    if (!managed || manualChat) allAuto = false;
    items.push({
      name: i.name,
      variantName: i.variantName || null,
      productId,
      variantId,
      quantity: i.quantity,
      managed,
      availableDeliverables: available,
      manualChat,
      deliveredContentSet: Boolean(i.deliveredContent),
    });
  }

  return {
    found: true,
    code: order.code,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paidAt: order.paidAt,
    paymentClaimedAt: order.paymentClaimedAt,
    hasDeliveryRecord: Boolean(order.delivery),
    wouldAutoDeliver: allAuto,
    items,
  };
}
