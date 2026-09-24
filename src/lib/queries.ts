import "server-only";
import { prisma } from "./prisma";
import type { ProductCardData } from "./types";
import { productStock, productFromPrice, hasVariants } from "./variants";

type RawVariant = {
  price: number;
  promoPrice: number | null;
  stock: number;
  active: boolean;
};

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  soldCount: number;
  category: { name: string } | null;
  images: { url: string }[];
  variants?: RawVariant[];
};

export function toCardData(p: RawProduct): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    price: p.price,
    promoPrice: p.promoPrice,
    stock: productStock(p),
    fromPrice: productFromPrice(p),
    hasVariants: hasVariants(p),
    featured: p.featured,
    bestSeller: p.bestSeller,
    soldCount: p.soldCount,
    categoryName: p.category?.name ?? null,
    image: p.images[0]?.url ?? null,
  };
}

const cardInclude = {
  category: { select: { name: true } },
  images: { orderBy: { position: "asc" as const }, take: 1 },
  variants: {
    where: { active: true },
    select: { price: true, promoPrice: true, stock: true, active: true },
  },
};

export async function getFeaturedProducts(limit = 4) {
  const products = await prisma.product.findMany({
    where: { active: true, featured: true },
    include: cardInclude,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return products.map(toCardData);
}

export async function getBestSellers(limit = 4) {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: cardInclude,
    orderBy: { soldCount: "desc" },
    take: limit,
  });
  return products.map(toCardData);
}

export async function getRecentProducts(limit = 4) {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: cardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(toCardData);
}

export async function getStoreStats() {
  const [availableProducts, categories, deliveredOrders] = await Promise.all([
    prisma.product.count({ where: { active: true, stock: { gt: 0 } } }),
    prisma.category.count(),
    prisma.order.count({ where: { status: "DELIVERED" } }),
  ]);
  return { availableProducts, categories, deliveredOrders };
}

export async function getCategoriesWithCount() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: { where: { active: true } } } },
    },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c._count.products,
  }));
}

export type CatalogFilters = {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  availability?: "all" | "in" | "out";
  sort?: "recent" | "best" | "price_asc" | "price_desc";
  featured?: boolean;
};

export async function getCatalogProducts(filters: CatalogFilters) {
  const where: any = { active: true };

  if (filters.featured) where.featured = true;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { shortDescription: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.category) {
    where.category = { slug: filters.category };
  }
  if (filters.availability === "in") where.stock = { gt: 0 };
  if (filters.availability === "out") where.stock = { lte: 0 };

  let orderBy: any = { createdAt: "desc" };
  if (filters.sort === "best") orderBy = { soldCount: "desc" };
  if (filters.sort === "price_asc") orderBy = { price: "asc" };
  if (filters.sort === "price_desc") orderBy = { price: "desc" };

  let products = await prisma.product.findMany({
    where,
    include: cardInclude,
    orderBy,
  });

  // Price filter uses the effective price, applied in-app for accuracy with promos.
  const min = filters.min ?? 0;
  const max = filters.max ?? Number.POSITIVE_INFINITY;
  const mapped = products
    .map(toCardData)
    .filter((p) => p.fromPrice >= min && p.fromPrice <= max);

  return mapped;
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      variants: {
        where: { active: true },
        orderBy: { position: "asc" },
      },
    },
  });
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4
) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: excludeId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: cardInclude,
    take: limit,
    orderBy: { soldCount: "desc" },
  });
  return products.map(toCardData);
}
