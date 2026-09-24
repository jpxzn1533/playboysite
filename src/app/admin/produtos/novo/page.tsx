import { prisma } from "@/lib/prisma";
import { AdminContainer, PageHeader, BackLink } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <AdminContainer>
      <BackLink href="/admin/produtos" label="Voltar para produtos" />
      <PageHeader
        title="Novo produto"
        subtitle="Cadastre um novo produto no catálogo."
      />
      <ProductForm categories={categories} />
    </AdminContainer>
  );
}
