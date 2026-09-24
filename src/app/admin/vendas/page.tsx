import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateTime } from "@/lib/format";
import { AdminContainer, PageHeader, EmptyState } from "@/components/admin/ui";
import { StatusBadge } from "@/components/store/StatusBadge";
import { SalesFilters } from "@/components/admin/SalesFilters";

export const dynamic = "force-dynamic";

type SP = { [key: string]: string | string[] | undefined };
const str = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const q = str(searchParams.q);
  const status = str(searchParams.status);

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { deliveryInfo: { contains: q, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: { user: true, items: true, delivery: true },
    orderBy: { createdAt: "desc" },
  });

  const revenue = orders
    .filter((o) => ["PAID", "PREPARING", "DELIVERED"].includes(o.status))
    .reduce((s, o) => s + o.total, 0);

  return (
    <AdminContainer>
      <PageHeader
        title="Vendas"
        subtitle={`${orders.length} pedido(s) · ${formatBRL(revenue)} em vendas confirmadas.`}
      />

      <SalesFilters />

      {orders.length === 0 ? (
        <EmptyState
          title="Nenhuma venda encontrada"
          desc="Ajuste os filtros ou aguarde novos pedidos."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Itens</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/vendas/${o.id}`}
                        className="font-medium text-white hover:underline"
                      >
                        {o.code}
                      </Link>
                      {o.delivery?.manual && (
                        <span className="ml-2 text-[10px] uppercase text-ink-500">
                          manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-300">
                      {o.user?.name ?? "Convidado"}
                    </td>
                    <td className="px-4 py-3 text-ink-300">{o.items.length}</td>
                    <td className="px-4 py-3 text-ink-400">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatBRL(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminContainer>
  );
}
