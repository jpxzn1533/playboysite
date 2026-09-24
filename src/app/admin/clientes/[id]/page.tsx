import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import {
  AdminContainer,
  PageHeader,
  BackLink,
  StatCard,
} from "@/components/admin/ui";
import { StatusBadge } from "@/components/store/StatusBadge";
import { DiscordIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const PAID = ["PAID", "PREPARING", "DELIVERED"];

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        include: { items: true, delivery: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const paidOrders = user.orders.filter((o) => PAID.includes(o.status));
  const spent = paidOrders.reduce((s, o) => s + o.total, 0);

  return (
    <AdminContainer>
      <BackLink href="/admin/clientes" label="Voltar para clientes" />

      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-700 text-2xl font-semibold text-white">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {user.name}
          </h1>
          <p className="text-sm text-ink-400">{user.email}</p>
          {user.discordName && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
              <DiscordIcon className="h-3.5 w-3.5" /> {user.discordName}
              {user.discordId ? ` · ID ${user.discordId}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total de pedidos" value={String(user.orders.length)} />
        <StatCard label="Total gasto" value={formatBRL(spent)} accent="good" />
        <StatCard
          label="Pedidos pagos"
          value={String(paidOrders.length)}
        />
        <StatCard label="Cliente desde" value={formatDate(user.createdAt)} />
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Histórico de compras
        </h3>
        {user.orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400">
            Este cliente ainda não fez pedidos.
          </p>
        ) : (
          <div className="space-y-3">
            {user.orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/vendas/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-ink-900/50 p-4 transition-colors hover:border-white/15"
              >
                <div>
                  <p className="font-medium text-white">{o.code}</p>
                  <p className="text-xs text-ink-400">
                    {formatDateTime(o.createdAt)} · {o.items.length} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-white">
                    {formatBRL(o.total)}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminContainer>
  );
}
