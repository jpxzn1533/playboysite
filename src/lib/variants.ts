import { effectivePrice } from "./format";

export type VariantLike = {
  price: number;
  promoPrice?: number | null;
  stock: number;
  reserved?: number;
  active: boolean;
};

export type ProductLike = {
  price: number;
  promoPrice?: number | null;
  stock: number;
  reserved?: number;
  variants?: VariantLike[];
};

export function hasVariants(p: ProductLike): boolean {
  return !!(p.variants && p.variants.length > 0);
}

export function activeVariants<T extends VariantLike>(variants?: T[]): T[] {
  return (variants ?? []).filter((v) => v.active);
}

/** Total stock (raw inventory): sum of active variants, or the product's own stock. */
export function productStock(p: ProductLike): number {
  if (hasVariants(p)) {
    return activeVariants(p.variants).reduce((s, v) => s + v.stock, 0);
  }
  return p.stock;
}

/** Units currently reserved by open/pending orders. */
export function productReserved(p: ProductLike): number {
  if (hasVariants(p)) {
    return activeVariants(p.variants).reduce((s, v) => s + (v.reserved ?? 0), 0);
  }
  return p.reserved ?? 0;
}

/** Available to sell right now = stock − reserved (never below 0). */
export function variantAvailable(v: VariantLike): number {
  return Math.max(0, v.stock - (v.reserved ?? 0));
}
export function productAvailable(p: ProductLike): number {
  if (hasVariants(p)) {
    return activeVariants(p.variants).reduce((s, v) => s + variantAvailable(v), 0);
  }
  return Math.max(0, p.stock - (p.reserved ?? 0));
}

/** Lowest effective price (used for "a partir de" when there are variants). */
export function productFromPrice(p: ProductLike): number {
  if (hasVariants(p)) {
    const av = activeVariants(p.variants);
    if (av.length) return Math.min(...av.map((v) => effectivePrice(v)));
  }
  return effectivePrice(p);
}
