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
import { AlertIcon, LayersIcon, BoxIcon, TagIcon } from "@/components/ui/icons";

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

  const dmap = new Map<string, { available: number; total: number }>();
  for (const row of dcounts) {
    const key = `${row.productId}|${row.variantId ?? ""}`;
    const cur = dmap.get(key) ?? { available: 0, total: 0 };
    cur.total += row._count._all;
    if (row.status === "AVAILABLE") cur.available += row._count._all;
    dmap.set(key, cur);
  }
  const managed = (productId: string, variantId: string | null) =>
    (dmap.get(`${productId}|${variantId ?? ""}`)?.total ?? 0) > 0;
  const productManagedTotal = (p: (typeof products)[number]) => {
    let t = 0;
    for (const [k, v] of dmap) if (k.startsWith(p.id + "|")) t += v.total;
    return t;
  };

  const stockOf = (p: (typeof products)[number]) =>
    p.variants.length > 0 ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
  const reservedOf = (p: (typeof products)[number]) =>
    p.variants.length > 0
      ? p.variants.reduce((s, v) => s + v.reserved, 0)
      : p.reserved;
  const soldOf = (p: (typeof products)[number]) =>
    p.variants.length > 0
      ? p.variants.reduce((s, v) => s + v.soldCount, 0)
      : p.soldCount;
  const availOf = (p: (typeof products)[number]) =>
    Math.max(0, stockOf(p) - reservedOf(p));

  const totalAvailable = products.reduce((s, p) => s + availOf(p), 0);
  const totalReserved = products.reduce((s, p) => s + reservedOf(p), 0);
  const totalSold = products.reduce((s, p) => s + soldOf(p), 0);
  const outOfStock = products.filter((p) => availOf(p) <= 0).length;
  const lowStock = products.filter(
    (p) => availOf(p) > 0 && availOf(p) <= p.lowStockThreshold
  ).length;

  return (
    <AdminContainer>
      <PageHeader
        title="Estoque"
        subtitle="Disponibilidade em tempo real. Cada venda reserva uma unidade; ao entregar, ela sai do estoque."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Disponível p/ vender"
          value={String(totalAvailable)}
          icon={<LayersIcon className="h-4 w-4" />}
          accent="good"
        />
        <StatCard
          label="Reservado (pedidos abertos)"
          value={String(totalReserved)}
          icon={<BoxIcon className="h-4 w-4" />}
          accent={totalReserved > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Vendidos"
          value={String(totalSold)}
          icon={<TagIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Esgotados / baixos"
          value={`${outOfStock} / ${lowStock}`}
          icon={<AlertIcon className="h-4 w-4" />}
          accent={outOfStock > 0 ? "danger" : lowStock > 0 ? "warn" : "default"}
        />
      </div>

      {/* How it works */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-ink-850/60 p-4 text-sm">
        <BoxIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-300" />
        <div className="text-ink-300">
          <p className="font-medium text-white">
            Disponível = Estoque − Reservado
          </p>
          <p className="mt-0.5 text-ink-400">
            Quando um cliente compra, a unidade vira <strong className="text-amber-300">Reservada</strong>{" "}
            e o <strong className="text-emerald-300">Disponível</strong> cai na hora. Ao marcar o pedido como
            entregue (ou pago+entrega automática), a unidade sai do{" "}
            <strong className="text-ink-200">Estoque</strong> e entra em{" "}
            <strong className="text-ink-200">Vendidos</strong>. Produtos com{" "}
            <strong className="text-ink-200">entregáveis</strong> têm o estoque = nº de itens disponíveis.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Disponível</th>
                <th className="px-4 py-3 text-center font-medium">Reservado</th>
                <th className="px-4 py-3 text-center font-medium">Vendidos</th>
                <th className="px-4 py-3 text-right font-medium">Estoque / entregáveis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {products.map((p) => {
                const hasVariants = p.variants.length > 0;
                const avail = availOf(p);
                const soldOut = avail <= 0;
                const low = !soldOut && avail <= p.lowStockThreshold;
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
                      <td className="px-4 py-3 text-center">
                        <span
                          className={
                            "font-heading text-base font-bold " +
                            (soldOut
                              ? "text-red-300"
                              : low
                                ? "text-amber-300"
                                : "text-emerald-300")
                          }
                        >
                          {avail}
                        </span>
                        <span className="ml-1 text-[10px] text-ink-500">
                          de {stockOf(p)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-ink-300">
                        {reservedOf(p) > 0 ? (
                          <span className="text-amber-300">{reservedOf(p)}</span>
                        ) : (
                          <span className="text-ink-500">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-ink-300">
                        {soldOf(p)}
                      </td>
                      <td className="px-4 py-3">
                        {hasVariants ? (
                          <div className="flex justify-end">
                            <Link
                              href={`/admin/estoque/${p.id}`}
                              className="rounded-lg bg-ink-750 px-2.5 py-1.5 text-xs font-medium text-ink-100 hover:bg-ink-700"
                            >
                              Gerenciar variações
                            </Link>
                          </div>
                        ) : prodManaged ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-ink-400">
                              {productManagedTotal(p)} entregáveis
                            </span>
                            <Link
                              href={`/admin/estoque/${p.id}`}
                              className="rounded-lg bg-ink-750 px-2.5 py-1.5 text-xs font-medium text-ink-100 hover:bg-ink-700"
                            >
                              Gerenciar
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/estoque/${p.id}`}
                              className="rounded-lg bg-ink-800 px-2 py-1.5 text-xs text-ink-300 hover:text-white"
                              title="Gerenciar entregáveis"
                            >
                              entregáveis
                            </Link>
                            <StockEditor id={p.id} stock={p.stock} />
                          </div>
                        )}
                      </td>
                    </tr>

                    {hasVariants &&
                      p.variants.map((v) => {
                        const vAvail = Math.max(0, v.stock - v.reserved);
                        const vManaged = managed(p.id, v.id);
                        const vOut = vAvail <= 0;
                        return (
                          <tr key={v.id} className="bg-ink-950/40 hover:bg-white/[0.02]">
                            <td className="px-4 py-2.5 pl-14 text-ink-300">
                              ↳ {v.name}
                            </td>
                            <td className="px-4 py-2.5">
                              {vOut ? (
                                <span className="text-xs text-red-300">Esgotado</span>
                              ) : (
                                <span className="text-xs text-ink-400">Ativo</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span
                                className={
                                  "font-heading font-bold " +
                                  (vOut ? "text-red-300" : "text-emerald-300")
                                }
                              >
                                {vAvail}
                              </span>
                              <span className="ml-1 text-[10px] text-ink-500">
                                de {v.stock}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center text-ink-400">
                              {v.reserved || 0}
                            </td>
                            <td className="px-4 py-2.5 text-center text-ink-400">
                              {v.soldCount}
                            </td>
                            <td className="px-4 py-2.5">
                              {vManaged ? (
                                <p className="text-right text-xs text-ink-400">
                                  gerenciado por entregáveis
                                </p>
                              ) : (
                                <div className="flex justify-end">
                                  <StockEditor id={v.id} stock={v.stock} variant />
                                </div>
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
