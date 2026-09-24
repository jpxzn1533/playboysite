import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/queries";
import { ProductDetail } from "@/components/store/ProductDetail";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id, 4);

  return (
    <div className="container-pb py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-400">
        <Link href="/" className="hover:text-white">
          Início
        </Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-white">
          Produtos
        </Link>
        <span>/</span>
        <span className="truncate text-ink-200">{product.name}</span>
      </nav>

      <Reveal>
        <ProductDetail
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            shortDescription: product.shortDescription,
            price: product.price,
            promoPrice: product.promoPrice,
            stock: product.stock,
            soldCount: product.soldCount,
            categoryName: product.category?.name ?? null,
            images: product.images.map((i) => i.url),
            variants: product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              promoPrice: v.promoPrice,
              stock: v.stock,
            })),
          }}
        />
      </Reveal>

      {related.length > 0 && (
        <section className="mt-20">
          <Reveal>
            <h2 className="section-title mb-7">Você também pode gostar</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
