import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureCart } from "@/lib/cart";
import { generateOrderCode } from "@/lib/log";

const schema = z.object({
  deliveryMethod: z.string().min(1).default("Discord"),
  deliveryInfo: z.string().min(2, "Informe seus dados de entrega (Discord)."),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const session = await getSession();
  const cart = await ensureCart();
  const full = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true, variant: true } } },
  });

  if (!full || full.items.length === 0) {
    return NextResponse.json({ error: "Seu carrinho está vazio." }, { status: 400 });
  }

  // Validate availability (stock minus already-reserved units).
  for (const item of full.items) {
    if (!item.product || !item.product.active) {
      return NextResponse.json(
        { error: `Um produto do carrinho não está mais disponível.` },
        { status: 409 }
      );
    }
    const stockSource = item.variant ?? item.product;
    const available = stockSource.stock - stockSource.reserved;
    const label = item.variant
      ? `${item.product.name} (${item.variant.name})`
      : item.product.name;
    if (item.quantity > available) {
      return NextResponse.json(
        {
          error: `Estoque insuficiente para "${label}". Disponível: ${Math.max(
            0,
            available
          )}.`,
        },
        { status: 409 }
      );
    }
  }

  const total = full.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        code: generateOrderCode(),
        userId: session?.userId ?? null,
        cartId: full.id,
        status: "AWAITING_PAYMENT",
        total,
        deliveryMethod: parsed.data.deliveryMethod,
        deliveryInfo: parsed.data.deliveryInfo,
        note: parsed.data.note ?? "",
        items: {
          create: full.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.product!.name,
            variantName: i.variant?.name ?? "",
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
    });

    // Reserve stock (on the variant when present, otherwise the product).
    for (const i of full.items) {
      if (i.variantId) {
        await tx.productVariant.update({
          where: { id: i.variantId },
          data: { reserved: { increment: i.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: i.productId },
          data: { reserved: { increment: i.quantity } },
        });
      }
    }

    // Close the cart (converted into an order).
    await tx.cart.update({
      where: { id: full.id },
      data: { status: "CONVERTED" },
    });

    // If any product requires manual chat delivery, open a conversation.
    const needsChat = full.items.some((i) => i.product?.manualChat);
    if (needsChat) {
      await tx.conversation.create({
        data: {
          orderId: created.id,
          userId: session?.userId ?? null,
          status: "OPEN",
        },
      });
    }

    return created;
  });

  return NextResponse.json({ ok: true, code: order.code, id: order.id });
}
