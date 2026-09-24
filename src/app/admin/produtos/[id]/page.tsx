import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminContainer, PageHeader, BackLink } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { position: "asc" } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <AdminContainer>
      <BackLink href="/admin/produtos" label="Voltar para produtos" />
      <PageHeader title="Editar produto" subtitle={product.name} />
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price,
          promoPrice: product.promoPrice,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          active: product.active,
          featured: product.featured,
          bestSeller: product.bestSeller,
          manualChat: product.manualChat,
          categoryId: product.categoryId,
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
    </AdminContainer>
  );
}
