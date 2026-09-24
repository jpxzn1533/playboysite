import { Fragment } from "react";
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
  const products = await prisma.product.findMany({
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { orderBy: { position: "asc" } },
    },
    orderBy: [{ name: "asc" }],
  });

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
        subtitle="Controle a disponibilidade dos seus produtos em tempo real."
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

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div className="text-sm">
            <p className="font-medium text-amber-200">Atenção ao estoque</p>
            <p className="text-amber-200/70">
              {outOfStock.length} produto(s) esgotado(s) e {lowStock.length} com
              estoque baixo. Reponha para não perder vendas.
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reservado</th>
                <th className="px-4 py-3 font-medium">Vendidos</th>
                <th className="px-4 py-3 text-right font-medium">Estoque atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {products.map((p) => {
                const hasVariants = p.variants.length > 0;
                const total = effStock(p);
                const soldOut = total <= 0;
                const low = !soldOut && total <= p.lowStockThreshold;
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
                        {hasVariants ? (
                          <p className="text-right text-ink-300">
                            {total}{" "}
                            <span className="text-xs text-ink-500">(total)</span>
                          </p>
                        ) : (
                          <StockEditor id={p.id} stock={p.stock} />
                        )}
                      </td>
                    </tr>
                    {hasVariants &&
                      p.variants.map((v) => {
                        const vOut = v.stock <= 0;
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
                            <td className="px-4 py-2.5">
                              <StockEditor id={v.id} stock={v.stock} variant />
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
