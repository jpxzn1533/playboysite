import { effectivePrice } from "./format";

export type VariantLike = {
  price: number;
  promoPrice?: number | null;
  stock: number;
  active: boolean;
};

export type ProductLike = {
  price: number;
  promoPrice?: number | null;
  stock: number;
  variants?: VariantLike[];
};

export function hasVariants(p: ProductLike): boolean {
  return !!(p.variants && p.variants.length > 0);
}

export function activeVariants<T extends VariantLike>(variants?: T[]): T[] {
  return (variants ?? []).filter((v) => v.active);
}

/** Total sellable stock: sum of active variants, or the product's own stock. */
export function productStock(p: ProductLike): number {
  if (hasVariants(p)) {
    return activeVariants(p.variants).reduce((s, v) => s + v.stock, 0);
  }
  return p.stock;
}

/** Lowest effective price (used for "a partir de" when there are variants). */
export function productFromPrice(p: ProductLike): number {
  if (hasVariants(p)) {
    const av = activeVariants(p.variants);
    if (av.length) return Math.min(...av.map((v) => effectivePrice(v)));
  }
  return effectivePrice(p);
}
