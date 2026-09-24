import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { productStock, productFromPrice, hasVariants } from "@/lib/variants";
import {
  AdminContainer,
  PageHeader,
  EmptyState,
} from "@/components/admin/ui";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { PlusIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminContainer>
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} produto(s) cadastrado(s).`}
        action={
          <Link href="/admin/produtos/novo" className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Novo produto
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado"
          desc="Comece criando seu primeiro produto."
          action={
            <Link href="/admin/produtos/novo" className="btn-primary mt-2">
              <PlusIcon className="h-4 w-4" /> Criar produto
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Preço</th>
                  <th className="px-4 py-3 font-medium">Estoque</th>
                  <th className="px-4 py-3 font-medium">Vendas</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {products.map((p) => {
                  const totalStock = productStock(p);
                  const fromPrice = productFromPrice(p);
                  const withVariants = hasVariants(p);
                  const soldOut = totalStock <= 0;
                  const low = !soldOut && totalStock <= p.lowStockThreshold;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                            {p.images[0] && (
                              <Image
                                src={p.images[0].url}
                                alt={p.name}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {p.name}
                            </p>
                            <div className="flex gap-1.5">
                              {p.featured && (
                                <span className="text-[10px] text-ink-400">
                                  Destaque
                                </span>
                              )}
                              {p.bestSeller && (
                                <span className="text-[10px] text-ink-400">
                                  · Mais vendido
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-300">
                        {p.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {withVariants && (
                          <span className="mr-1 text-[10px] text-ink-500">
                            a partir de
                          </span>
                        )}
                        <span className="text-white">{formatBRL(fromPrice)}</span>
                        {!withVariants &&
                          p.promoPrice != null &&
                          p.promoPrice < p.price && (
                            <span className="ml-1.5 text-xs text-ink-500 line-through">
                              {formatBRL(p.price)}
                            </span>
                          )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            soldOut
                              ? "text-red-300"
                              : low
                                ? "text-amber-300"
                                : "text-ink-200"
                          }
                        >
                          {totalStock}
                        </span>
                        {withVariants && (
                          <span className="ml-1 text-[10px] text-ink-500">
                            ({p.variants.length}v)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-300">{p.soldCount}</td>
                      <td className="px-4 py-3">
                        <ProductRowActions
                          id={p.id}
                          active={p.active}
                          name={p.name}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminContainer>
  );
}
