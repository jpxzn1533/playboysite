import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDate, relativeTime } from "@/lib/format";
import { AdminContainer, PageHeader, EmptyState } from "@/components/admin/ui";
import { DiscordIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const PAID = ["PAID", "PREPARING", "DELIVERED"];

export default async function CustomersPage() {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: { select: { total: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminContainer>
      <PageHeader
        title="Clientes"
        subtitle={`${users.length} cliente(s) cadastrado(s).`}
      />

      {users.length === 0 ? (
        <EmptyState title="Nenhum cliente" desc="Ainda não há clientes cadastrados." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Discord</th>
                  <th className="px-4 py-3 font-medium">Pedidos</th>
                  <th className="px-4 py-3 font-medium">Total gasto</th>
                  <th className="px-4 py-3 font-medium">Último pedido</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.map((u) => {
                  const paidOrders = u.orders.filter((o) =>
                    PAID.includes(o.status)
                  );
                  const spent = paidOrders.reduce((s, o) => s + o.total, 0);
                  const last = u.orders.reduce<Date | null>(
                    (acc, o) =>
                      !acc || o.createdAt > acc ? o.createdAt : acc,
                    null
                  );
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/clientes/${u.id}`}
                          className="flex items-center gap-3"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-white hover:underline">
                              {u.name}
                            </p>
                            <p className="text-xs text-ink-400">{u.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-300">
                        {u.discordName ? (
                          <span className="flex items-center gap-1.5">
                            <DiscordIcon className="h-3.5 w-3.5" />
                            {u.discordName}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-300">
                        {u.orders.length}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {formatBRL(spent)}
                      </td>
                      <td className="px-4 py-3 text-ink-400">
                        {last ? relativeTime(last) : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-400">
                        {formatDate(u.createdAt)}
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
