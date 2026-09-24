import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  AdminContainer,
  PageHeader,
  StatCard,
} from "@/components/admin/ui";
import { StockEditor } from "@/components/admin/StockEditor";
import { AlertIcon, LayersIcon, BoxIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const [products, dcounts] = await Promise.all([
    prisma.product.findMany({
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { orderBy: { position: "asc" } },
      },
      orderBy: [{ name: "asc" }],
    }),
    prisma.deliverable.groupBy({
      by: ["productId", "variantId", "status"],
      _count: { _all: true },
    }),
  ]);

  // Map of scope -> { available, total }
  const dmap = new Map<string, { available: number; total: number }>();
  for (const row of dcounts) {
    const key = `${row.productId}|${row.variantId ?? ""}`;
    const cur = dmap.get(key) ?? { available: 0, total: 0 };
    cur.total += row._count._all;
    if (row.status === "AVAILABLE") cur.available += row._count._all;
    dmap.set(key, cur);
  }
  const scope = (productId: string, variantId: string | null) =>
    dmap.get(`${productId}|${variantId ?? ""}`) ?? { available: 0, total: 0 };
  const managed = (productId: string, variantId: string | null) =>
    scope(productId, variantId).total > 0;
  const productManagedTotal = (p: (typeof products)[number]) => {
    let t = 0;
    for (const [k, v] of dmap) if (k.startsWith(p.id + "|")) t += v.total;
    return t;
  };

  const effStock = (p: (typeof products)[number]) =>
    p.variants.length > 0
      ? p.variants.reduce((s, v) => s + v.stock, 0)
      : p.stock;
  const effReserved = (p: (typeof products)[number]) =>
    p.variants.length > 0
      ? p.variants.reduce((s, v) => s + v.reserved, 0)
      : p.reserved;
  const effSold = (p: (typeof products)[number]) =>
    p.variants.length > 0
      ? p.variants.reduce((s, v) => s + v.soldCount, 0)
      : p.soldCount;

  const outOfStock = products.filter((p) => effStock(p) <= 0);
  const lowStock = products.filter(
    (p) => effStock(p) > 0 && effStock(p) <= p.lowStockThreshold
  );
  const totalReserved = products.reduce((s, p) => s + effReserved(p), 0);
  const totalUnits = products.reduce((s, p) => s + effStock(p), 0);

  return (
    <AdminContainer>
      <PageHeader
        title="Estoque"
        subtitle="Gerencie os entregáveis (códigos/contas/dados) de cada produto. Cada entregável = 1 unidade de estoque."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Unidades em estoque"
          value={String(totalUnits)}
          icon={<LayersIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Reservado"
          value={String(totalReserved)}
          hint="Em pedidos pendentes"
          icon={<BoxIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Estoque baixo"
          value={String(lowStock.length)}
          icon={<AlertIcon className="h-4 w-4" />}
          accent={lowStock.length > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Esgotados"
          value={String(outOfStock.length)}
          icon={<AlertIcon className="h-4 w-4" />}
          accent={outOfStock.length > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-ink-850/60 p-4">
        <BoxIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-300" />
        <div className="text-sm text-ink-300">
          <p className="font-medium text-white">Como funciona o estoque por entregáveis</p>
          <p className="mt-0.5 text-ink-400">
            Clique em <strong className="text-ink-200">Entregáveis</strong> em um produto e
            cadastre os itens (um por linha). O estoque passa a ser a quantidade de
            entregáveis disponíveis, e cada entrega consome um item automaticamente.
            Produtos sem entregáveis continuam com estoque manual.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reservado</th>
                <th className="px-4 py-3 font-medium">Vendidos</th>
                <th className="px-4 py-3 font-medium">Entregáveis</th>
                <th className="px-4 py-3 text-right font-medium">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {products.map((p) => {
                const hasVariants = p.variants.length > 0;
                const total = effStock(p);
                const soldOut = total <= 0;
                const low = !soldOut && total <= p.lowStockThreshold;
                const prodManaged = managed(p.id, null);
                return (
                  <Fragment key={p.id}>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                            {p.images[0] && (
                              <Image
                                src={p.images[0].url}
                                alt={p.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-white">{p.name}</span>
                            {hasVariants && (
                              <span className="ml-2 text-[11px] text-ink-400">
                                {p.variants.length} variações
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {soldOut ? (
                          <span className="badge border-red-500/20 bg-red-500/10 text-red-300">
                            Esgotado
                          </span>
                        ) : low ? (
                          <span className="badge border-amber-400/20 bg-amber-400/10 text-amber-300">
                            Baixo
                          </span>
                        ) : (
                          <span className="badge border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                            Em estoque
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-300">{effReserved(p)}</td>
                      <td className="px-4 py-3 text-ink-300">{effSold(p)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/estoque/${p.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-750 px-2.5 py-1.5 text-xs font-medium text-ink-100 transition-colors hover:bg-ink-700"
                        >
                          <BoxIcon className="h-3.5 w-3.5" />
                          Gerenciar
                          {productManagedTotal(p) > 0 && (
                            <span className="text-ink-400">
                              ({productManagedTotal(p)})
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {hasVariants ? (
                          <p className="text-right text-ink-300">
                            {total}{" "}
                            <span className="text-xs text-ink-500">(total)</span>
                          </p>
                        ) : prodManaged ? (
                          <p className="text-right">
                            <span className="text-ink-200">{p.stock}</span>
                            <span className="ml-1 text-[10px] text-ink-500">
                              (entregáveis)
                            </span>
                          </p>
                        ) : (
                          <StockEditor id={p.id} stock={p.stock} />
                        )}
                      </td>
                    </tr>
                    {hasVariants &&
                      p.variants.map((v) => {
                        const vOut = v.stock <= 0;
                        const vManaged = managed(p.id, v.id);
                        return (
                          <tr
                            key={v.id}
                            className="bg-ink-950/40 hover:bg-white/[0.02]"
                          >
                            <td className="px-4 py-2.5 pl-14">
                              <span className="text-ink-300">↳ {v.name}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              {vOut ? (
                                <span className="text-xs text-red-300">Esgotado</span>
                              ) : (
                                <span className="text-xs text-ink-400">Ativo</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-ink-400">{v.reserved}</td>
                            <td className="px-4 py-2.5 text-ink-400">{v.soldCount}</td>
                            <td className="px-4 py-2.5 text-xs text-ink-500">
                              {scope(p.id, v.id).available} disp.
                            </td>
                            <td className="px-4 py-2.5">
                              {vManaged ? (
                                <p className="text-right">
                                  <span className="text-ink-200">{v.stock}</span>
                                  <span className="ml-1 text-[10px] text-ink-500">
                                    (entregáveis)
                                  </span>
                                </p>
                              ) : (
                                <StockEditor id={v.id} stock={v.stock} variant />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminContainer>
  );
}
