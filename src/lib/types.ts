export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  promoPrice: number | null;
  /** Total sellable stock (sum of active variants when the product has variants). */
  stock: number;
  /** Lowest effective price — shown as "a partir de" when hasVariants. */
  fromPrice: number;
  hasVariants: boolean;
  featured: boolean;
  bestSeller: boolean;
  soldCount: number;
  categoryName: string | null;
  image: string | null;
};
