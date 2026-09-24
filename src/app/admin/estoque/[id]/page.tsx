import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminContainer, PageHeader, BackLink } from "@/components/admin/ui";
import {
  DeliverablesSection,
  type DeliverableRow,
} from "@/components/admin/DeliverablesSection";

export const dynamic = "force-dynamic";

export default async function ManageDeliverablesPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      variants: { orderBy: { position: "asc" } },
      deliverables: {
        orderBy: { createdAt: "asc" },
        include: { order: { select: { code: true } } },
      },
    },
  });

  if (!product) notFound();

  const toRows = (variantId: string | null): DeliverableRow[] =>
    product.deliverables
      .filter((d) => (d.variantId ?? null) === variantId)
      .map((d) => ({
        id: d.id,
        content: d.content,
        status: d.status,
        orderCode: d.order?.code ?? null,
      }));

  return (
    <AdminContainer>
      <BackLink href="/admin/estoque" label="Voltar para estoque" />
      <PageHeader
        title="Entregáveis"
        subtitle={`${product.name} — cadastre o conteúdo entregue ao cliente. Cada item = 1 unidade de estoque.`}
      />

      {product.variants.length > 0 ? (
        <div className="space-y-4">
          {product.variants.map((v) => (
            <DeliverablesSection
              key={v.id}
              productId={product.id}
              variantId={v.id}
              label={`Variação: ${v.name}`}
              items={toRows(v.id)}
            />
          ))}
        </div>
      ) : (
        <DeliverablesSection
          productId={product.id}
          variantId={null}
          label="Entregáveis do produto"
          items={toRows(null)}
        />
      )}
    </AdminContainer>
  );
}
