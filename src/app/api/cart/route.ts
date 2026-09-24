import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCart } from "@/lib/cart";
import { effectivePrice } from "@/lib/format";

export const dynamic = "force-dynamic";

async function serializeCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  const items = (cart?.items ?? [])
    .filter((i) => i.product)
    .map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId ?? null,
      name: i.product!.name,
      variantName: i.variant?.name ?? "",
      slug: i.product!.slug,
      image: i.product!.images[0]?.url ?? null,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      stock: i.variant ? i.variant.stock : i.product!.stock,
      lineTotal: i.unitPrice * i.quantity,
    }));

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, subtotal, total: subtotal, count };
}

export async function GET() {
  const cart = await ensureCart();
  return NextResponse.json(await serializeCart(cart.id));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const productId = String(body.productId ?? "");
  const variantId = body.variantId ? String(body.variantId) : null;
  const quantity = Math.max(1, Number(body.quantity ?? 1));
  if (!productId) {
    return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { where: { active: true } } },
  });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Produto indisponível." }, { status: 404 });
  }

  let unitPrice: number;
  let availableStock: number;

  if (product.variants.length > 0) {
    if (!variantId) {
      return NextResponse.json(
        { error: "Selecione uma variação." },
        { status: 400 }
      );
    }
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      return NextResponse.json(
        { error: "Variação indisponível." },
        { status: 404 }
      );
    }
    unitPrice = effectivePrice(variant);
    availableStock = variant.stock;
  } else {
    unitPrice = effectivePrice(product);
    availableStock = product.stock;
  }

  if (availableStock <= 0) {
    return NextResponse.json({ error: "Produto esgotado." }, { status: 409 });
  }

  const cart = await ensureCart();
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId },
  });

  const desired = (existing?.quantity ?? 0) + quantity;
  if (desired > availableStock) {
    return NextResponse.json(
      { error: `Apenas ${availableStock} unidade(s) em estoque.` },
      { status: 409 }
    );
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: desired, unitPrice },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity, unitPrice },
    });
  }
  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(await serializeCart(cart.id));
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const itemId = String(body.itemId ?? "");
  const quantity = Number(body.quantity ?? 0);
  if (!itemId) {
    return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  }

  const cart = await ensureCart();
  const existing = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { product: true, variant: true },
  });
  if (!existing) {
    return NextResponse.json(await serializeCart(cart.id));
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  } else {
    const stock = existing.variant
      ? existing.variant.stock
      : existing.product?.stock ?? 0;
    if (quantity > stock) {
      return NextResponse.json(
        { error: `Apenas ${stock} unidade(s) em estoque.` },
        { status: 409 }
      );
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });
  }
  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(await serializeCart(cart.id));
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId") ?? "";
  const cart = await ensureCart();
  if (itemId) {
    await prisma.cartItem
      .deleteMany({ where: { id: itemId, cartId: cart.id } })
      .catch(() => null);
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });
  }
  return NextResponse.json(await serializeCart(cart.id));
}
