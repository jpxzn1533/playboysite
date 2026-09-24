"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction, generateOrderCode } from "@/lib/log";
import { slugify } from "@/lib/format";
import { syncStock, consumeDeliverables, isManaged } from "@/lib/stock";
import { fulfillOrder } from "@/lib/fulfill";

type ActionResult = { ok: boolean; error?: string; id?: string; code?: string };

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function str(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const base = slugify(name) || "produto";
  let slug = base;
  let i = 1;
  while (true) {
    const existing = await prisma.product.findFirst({
      where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${++i}`;
  }
}

function parseImages(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type ParsedVariant = {
  id?: string;
  name: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  active: boolean;
};

function parseVariants(raw: string): ParsedVariant[] {
  if (!raw) return [];
  let arr: any[];
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => ({
      id: v.id ? String(v.id) : undefined,
      name: String(v.name ?? "").trim(),
      price: Number(v.price) || 0,
      promoPrice:
        v.promoPrice != null && Number(v.promoPrice) > 0
          ? Number(v.promoPrice)
          : null,
      stock: Math.max(0, Math.round(Number(v.stock) || 0)),
      active: v.active === false ? false : true,
    }))
    .filter((v) => v.name && v.price > 0);
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }

  const name = str(formData.get("name"));
  if (!name) return { ok: false, error: "Informe o nome do produto." };

  const price = num(formData.get("price"));
  if (price <= 0) return { ok: false, error: "Informe um preço válido." };

  const promoRaw = str(formData.get("promoPrice"));
  const promoPrice = promoRaw ? num(formData.get("promoPrice")) : null;
  const categoryId = str(formData.get("categoryId")) || null;
  const images = parseImages(str(formData.get("images")));
  const variants = parseVariants(str(formData.get("variants")));

  const product = await prisma.product.create({
    data: {
      name,
      slug: await uniqueSlug(name),
      shortDescription: str(formData.get("shortDescription")),
      description: str(formData.get("description")),
      price,
      promoPrice: promoPrice && promoPrice > 0 ? promoPrice : null,
      stock: Math.max(0, Math.round(num(formData.get("stock")))),
      lowStockThreshold: Math.max(1, Math.round(num(formData.get("lowStockThreshold"), 5))),
      active: str(formData.get("active")) === "on",
      featured: str(formData.get("featured")) === "on",
      bestSeller: str(formData.get("bestSeller")) === "on",
      manualChat: str(formData.get("manualChat")) === "on",
      categoryId,
      images: { create: images.map((url, i) => ({ url, position: i })) },
      variants: {
        create: variants.map((v, i) => ({
          name: v.name,
          price: v.price,
          promoPrice: v.promoPrice,
          stock: v.stock,
          active: v.active,
          position: i,
        })),
      },
    },
  });

  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Produto criado",
    entityType: "Product",
    entityId: product.id,
    detail: `Produto "${name}" cadastrado.`,
  });

  revalidateAll();
  return { ok: true, id: product.id };
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }

  const name = str(formData.get("name"));
  if (!name) return { ok: false, error: "Informe o nome do produto." };
  const price = num(formData.get("price"));
  if (price <= 0) return { ok: false, error: "Informe um preço válido." };

  const promoRaw = str(formData.get("promoPrice"));
  const promoPrice = promoRaw ? num(formData.get("promoPrice")) : null;
  const images = parseImages(str(formData.get("images")));
  const variants = parseVariants(str(formData.get("variants")));

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name,
        slug: await uniqueSlug(name, id),
        shortDescription: str(formData.get("shortDescription")),
        description: str(formData.get("description")),
        price,
        promoPrice: promoPrice && promoPrice > 0 ? promoPrice : null,
        lowStockThreshold: Math.max(
          1,
          Math.round(num(formData.get("lowStockThreshold"), 5))
        ),
        active: str(formData.get("active")) === "on",
        featured: str(formData.get("featured")) === "on",
        bestSeller: str(formData.get("bestSeller")) === "on",
        manualChat: str(formData.get("manualChat")) === "on",
        categoryId: str(formData.get("categoryId")) || null,
      },
    });

    // Replace image set.
    await tx.productImage.deleteMany({ where: { productId: id } });
    if (images.length) {
      await tx.productImage.createMany({
        data: images.map((url, i) => ({ productId: id, url, position: i })),
      });
    }

    // Reconcile variants: update kept, create new, delete removed.
    const existing = await tx.productVariant.findMany({ where: { productId: id } });
    const keepIds = variants.filter((v) => v.id).map((v) => v.id!);
    const toDelete = existing.filter((e) => !keepIds.includes(e.id));
    if (toDelete.length) {
      await tx.productVariant.deleteMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
      });
    }
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (v.id && existing.some((e) => e.id === v.id)) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: {
            name: v.name,
            price: v.price,
            promoPrice: v.promoPrice,
            stock: v.stock,
            active: v.active,
            position: i,
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId: id,
            name: v.name,
            price: v.price,
            promoPrice: v.promoPrice,
            stock: v.stock,
            active: v.active,
            position: i,
          },
        });
      }
    }
  });

  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Produto atualizado",
    entityType: "Product",
    entityId: id,
    detail: `Produto "${name}" editado.`,
  });

  revalidateAll();
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const product = await prisma.product.findUnique({ where: { id } });
  await prisma.product.delete({ where: { id } });
  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Produto excluído",
    entityType: "Product",
    entityId: id,
    detail: `Produto "${product?.name ?? id}" removido.`,
  });
  revalidateAll();
  return { ok: true };
}

export async function toggleProductActive(id: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { ok: false, error: "Produto não encontrado." };
  const updated = await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  });
  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: updated.active ? "Produto ativado" : "Produto desativado",
    entityType: "Product",
    entityId: id,
    detail: `Produto "${product.name}" ${updated.active ? "ativado" : "desativado"}.`,
  });
  revalidateAll();
  return { ok: true };
}

export async function setStock(
  id: string,
  value: number
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { ok: false, error: "Produto não encontrado." };
  const newStock = Math.max(0, Math.round(value));
  await prisma.product.update({ where: { id }, data: { stock: newStock } });
  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Estoque atualizado",
    entityType: "Product",
    entityId: id,
    detail: `Estoque de "${product.name}" definido para ${newStock} (antes: ${product.stock}).`,
  });
  revalidateAll();
  return { ok: true };
}

export async function adjustStock(
  id: string,
  delta: number
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { ok: false, error: "Produto não encontrado." };
  const newStock = Math.max(0, product.stock + Math.round(delta));
  await prisma.product.update({ where: { id }, data: { stock: newStock } });
  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: delta >= 0 ? "Estoque adicionado" : "Estoque reduzido",
    entityType: "Product",
    entityId: id,
    detail: `${delta >= 0 ? "+" : ""}${Math.round(delta)} un. em "${product.name}" (total: ${newStock}).`,
  });
  revalidateAll();
  return { ok: true };
}

export async function setVariantStock(
  variantId: string,
  value: number
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { name: true } } },
  });
  if (!variant) return { ok: false, error: "Variação não encontrada." };
  const newStock = Math.max(0, Math.round(value));
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: newStock },
  });
  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Estoque atualizado (variação)",
    entityType: "ProductVariant",
    entityId: variantId,
    detail: `Estoque de "${variant.product.name} — ${variant.name}" definido para ${newStock} (antes: ${variant.stock}).`,
  });
  revalidateAll();
  return { ok: true };
}

export async function adjustVariantStock(
  variantId: string,
  delta: number
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { name: true } } },
  });
  if (!variant) return { ok: false, error: "Variação não encontrada." };
  const newStock = Math.max(0, variant.stock + Math.round(delta));
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: newStock },
  });
  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: delta >= 0 ? "Estoque adicionado (variação)" : "Estoque reduzido (variação)",
    entityType: "ProductVariant",
    entityId: variantId,
    detail: `${delta >= 0 ? "+" : ""}${Math.round(delta)} un. em "${variant.product.name} — ${variant.name}" (total: ${newStock}).`,
  });
  revalidateAll();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Open carts — admin editing + manual delivery                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Manual delivery chats (conversations)                               */
/* ------------------------------------------------------------------ */

export async function setConversationStatus(
  conversationId: string,
  status: "OPEN" | "CLOSED"
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { order: { select: { code: true } } },
  });
  if (!convo) return { ok: false, error: "Atendimento não encontrado." };

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
  });

  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: status === "CLOSED" ? "Atendimento encerrado" : "Atendimento reaberto",
    entityType: "Conversation",
    entityId: convo.order?.code ?? conversationId,
  });

  revalidatePath("/admin/entregas-manuais");
  revalidatePath(`/admin/entregas-manuais/${conversationId}`);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Deliverables (stock inventory)                                      */
/* ------------------------------------------------------------------ */

export async function addDeliverables(
  productId: string,
  variantId: string | null,
  raw: string
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }

  const lines = (raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { ok: false, error: "Cole ao menos um entregável (um por linha)." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });
  if (!product) return { ok: false, error: "Produto não encontrado." };

  await prisma.$transaction(async (tx) => {
    await tx.deliverable.createMany({
      data: lines.map((content) => ({
        productId,
        variantId: variantId ?? null,
        content,
        status: "AVAILABLE",
      })),
    });
    await syncStock(tx, productId, variantId ?? null);
  });

  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Entregáveis adicionados",
    entityType: "Deliverable",
    entityId: productId,
    detail: `+${lines.length} entregavel(is) adicionados.`,
  });

  revalidateAll();
  revalidatePath(`/admin/estoque/${productId}`);
  return { ok: true };
}

export async function removeDeliverable(id: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const item = await prisma.deliverable.findUnique({ where: { id } });
  if (!item) return { ok: true };
  if (item.status !== "AVAILABLE") {
    return {
      ok: false,
      error: "Este entregável já foi entregue e não pode ser removido.",
    };
  }
  await prisma.$transaction(async (tx) => {
    await tx.deliverable.delete({ where: { id } });
    await syncStock(tx, item.productId, item.variantId);
  });
  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Entregável removido",
    entityType: "Deliverable",
    entityId: item.productId,
  });
  revalidateAll();
  revalidatePath(`/admin/estoque/${item.productId}`);
  return { ok: true };
}

const eff = (p: { price: number; promoPrice: number | null }) =>
  p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price
    ? p.promoPrice
    : p.price;

export async function addCartItem(
  cartId: string,
  productId: string,
  variantId: string | null = null
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { where: { active: true } } },
  });
  if (!product) return { ok: false, error: "Produto não encontrado." };

  let unitPrice: number;
  if (product.variants.length > 0) {
    if (!variantId) return { ok: false, error: "Selecione uma variação." };
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return { ok: false, error: "Variação não encontrada." };
    unitPrice = eff(variant);
  } else {
    variantId = null;
    unitPrice = eff(product);
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId, variantId },
  });
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + 1, unitPrice },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId, variantId, quantity: 1, unitPrice },
    });
  }
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  revalidatePath(`/admin/carrinhos/${cartId}`);
  revalidatePath("/admin/carrinhos");
  return { ok: true };
}

export async function setCartItemQty(
  itemId: string,
  quantity: number
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, error: "Item não encontrado." };
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.round(quantity) },
    });
  }
  await prisma.cart.update({
    where: { id: item.cartId },
    data: { updatedAt: new Date() },
  });
  revalidatePath(`/admin/carrinhos/${item.cartId}`);
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: true };
  await prisma.cartItem.delete({ where: { id: itemId } });
  await prisma.cart.update({
    where: { id: item.cartId },
    data: { updatedAt: new Date() },
  });
  revalidatePath(`/admin/carrinhos/${item.cartId}`);
  return { ok: true };
}

/**
 * Manual delivery: converts an OPEN cart directly into a DELIVERED order,
 * WITHOUT requiring any payment. Decrements stock, increments sold count,
 * records who delivered it and when.
 */
export async function manualDeliverCart(
  cartId: string,
  note: string
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true, variant: true } }, user: true },
  });
  if (!cart) return { ok: false, error: "Carrinho não encontrado." };
  if (cart.status !== "OPEN") {
    return { ok: false, error: "Este carrinho não está mais aberto." };
  }
  if (cart.items.length === 0) {
    return { ok: false, error: "O carrinho está vazio." };
  }

  const total = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const snapshot = cart.items.map((i) => ({
    name: i.variant
      ? `${i.product?.name ?? "Produto"} — ${i.variant.name}`
      : i.product?.name ?? "Produto",
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }));

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        code: generateOrderCode(),
        userId: cart.userId,
        cartId: cart.id,
        status: "DELIVERED",
        total,
        deliveryMethod: "Entrega manual",
        deliveryInfo: cart.user?.discordName
          ? `Discord: ${cart.user.discordName}`
          : "Entrega manual (sem pagamento)",
        note,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.product?.name ?? "Produto",
            variantName: i.variant?.name ?? "",
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    for (const i of cart.items) {
      // Consume deliverables when the scope is managed by them.
      const contents = await consumeDeliverables(tx, {
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        orderId: created.id,
      });
      const managed = contents.length > 0 || (await isManaged(tx, i.productId, i.variantId));

      if (contents.length > 0) {
        const orderItem = created.items.find(
          (oi) => oi.productId === i.productId && oi.variantId === i.variantId
        );
        if (orderItem) {
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { deliveredContent: contents.join("\n") },
          });
        }
      }

      // Sold count always increments; stock is handled by consume (managed) or
      // decremented manually (non-managed).
      if (i.variant) {
        await tx.productVariant.update({
          where: { id: i.variant.id },
          data: {
            soldCount: { increment: i.quantity },
            ...(managed ? {} : { stock: Math.max(0, i.variant.stock - i.quantity) }),
          },
        });
        if (i.product) {
          await tx.product.update({
            where: { id: i.productId },
            data: { soldCount: { increment: i.quantity } },
          });
        }
      } else if (i.product) {
        await tx.product.update({
          where: { id: i.productId },
          data: {
            soldCount: { increment: i.quantity },
            ...(managed ? {} : { stock: Math.max(0, i.product.stock - i.quantity) }),
          },
        });
      }
    }

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "CONVERTED" },
    });

    await tx.delivery.create({
      data: {
        orderId: created.id,
        adminId: admin.userId,
        manual: true,
        note,
        snapshot: JSON.stringify(snapshot),
      },
    });

    return created;
  });

  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Entrega manual realizada",
    entityType: "Order",
    entityId: order.code,
    detail: `Pedido ${order.code} entregue manualmente sem pagamento a partir do carrinho ${cart.id.slice(-6)}.`,
  });

  revalidateAll();
  return { ok: true, code: order.code, id: order.id };
}

export async function abandonCart(cartId: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }
  await prisma.cart.update({
    where: { id: cartId },
    data: { status: "ABANDONED" },
  });
  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Carrinho marcado como abandonado",
    entityType: "Cart",
    entityId: cartId,
  });
  revalidateAll();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Orders / sales                                                      */
/* ------------------------------------------------------------------ */

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Não autorizado." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!order) return { ok: false, error: "Pedido não encontrado." };

  if (status === "DELIVERED") {
    await fulfillOrder(orderId, admin.userId, false);
  } else if (status === "CANCELLED") {
    await prisma.$transaction(async (tx) => {
      // Release reserved stock if it was reserving.
      if (["AWAITING_PAYMENT", "PAID", "PREPARING"].includes(order.status)) {
        for (const i of order.items) {
          if (i.variant) {
            await tx.productVariant.update({
              where: { id: i.variant.id },
              data: { reserved: Math.max(0, i.variant.reserved - i.quantity) },
            });
          } else if (i.product) {
            await tx.product.update({
              where: { id: i.product.id },
              data: { reserved: Math.max(0, i.product.reserved - i.quantity) },
            });
          }
        }
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    });
  } else {
    await prisma.order.update({ where: { id: orderId }, data: { status } });
  }

  await logAdminAction({
    adminId: admin.userId,
    adminName: admin.name,
    action: "Status do pedido alterado",
    entityType: "Order",
    entityId: order.code,
    detail: `Pedido ${order.code}: ${order.status} → ${status}.`,
  });

  revalidateAll();
  return { ok: true };
}
