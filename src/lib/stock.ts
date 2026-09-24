import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

// Accepts either the prisma client or a transaction client.
type Db = PrismaClient | Prisma.TransactionClient;

/**
 * A "stock scope" is either a specific variant (when the product has variants)
 * or the product itself (variantId = null).
 */
export function scopeWhere(productId: string, variantId: string | null) {
  return { productId, variantId: variantId ?? null };
}

/** Count of AVAILABLE deliverables for a scope. */
export async function availableCount(
  db: Db,
  productId: string,
  variantId: string | null
): Promise<number> {
  return db.deliverable.count({
    where: { ...scopeWhere(productId, variantId), status: "AVAILABLE" },
  });
}

/** Whether a scope is managed by deliverables (has at least one entry). */
export async function isManaged(
  db: Db,
  productId: string,
  variantId: string | null
): Promise<boolean> {
  const n = await db.deliverable.count({
    where: scopeWhere(productId, variantId),
  });
  return n > 0;
}

/**
 * Re-sync the cached `stock` number of a scope to the number of AVAILABLE
 * deliverables — but ONLY when the scope is managed by deliverables. Non-managed
 * scopes keep their manual stock number untouched.
 */
export async function syncStock(
  db: Db,
  productId: string,
  variantId: string | null
): Promise<void> {
  const managed = await isManaged(db, productId, variantId);
  if (!managed) return;
  const available = await availableCount(db, productId, variantId);
  if (variantId) {
    await db.productVariant.update({
      where: { id: variantId },
      data: { stock: available },
    });
  } else {
    await db.product.update({
      where: { id: productId },
      data: { stock: available },
    });
  }
}

/**
 * Consume up to `quantity` AVAILABLE deliverables for a scope, marking them
 * DELIVERED and attaching them to the order. Returns the delivered content
 * strings (may be fewer than requested if not enough are available).
 * Re-syncs the scope stock afterwards.
 */
export async function consumeDeliverables(
  db: Db,
  params: {
    productId: string;
    variantId: string | null;
    quantity: number;
    orderId: string;
  }
): Promise<string[]> {
  const { productId, variantId, quantity, orderId } = params;

  const managed = await isManaged(db, productId, variantId);
  if (!managed) return [];

  const items = await db.deliverable.findMany({
    where: { ...scopeWhere(productId, variantId), status: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
    take: Math.max(0, quantity),
  });

  if (items.length > 0) {
    await db.deliverable.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: { status: "DELIVERED", orderId, deliveredAt: new Date() },
    });
  }

  await syncStock(db, productId, variantId);
  return items.map((i) => i.content);
}
