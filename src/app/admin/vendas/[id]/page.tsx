import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateTime } from "@/lib/format";
import { AdminContainer, PageHeader, BackLink } from "@/components/admin/ui";
import { StatusBadge } from "@/components/store/StatusBadge";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { UserIcon, DiscordIcon, BoxIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function SaleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      items: true,
      delivery: { include: { admin: true } },
    },
  });

  if (!order) notFound();

  return (
    <AdminContainer>
      <BackLink href="/admin/vendas" label="Voltar para vendas" />
      <PageHeader
        title={`Pedido ${order.code}`}
        subtitle={`Criado em ${formatDateTime(order.createdAt)}`}
        action={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">
              Itens do pedido
            </h3>
            <div className="divide-y divide-white/[0.06]">
              {order.items.map((it) => (
                <div key={it.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">
                        {it.name}
                        {it.variantName && (
                          <span className="ml-2 rounded-md border border-white/10 bg-ink-800 px-1.5 py-0.5 text-[11px] text-ink-300">
                            {it.variantName}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-ink-400">
                        {it.quantity} × {formatBRL(it.unitPrice)}
                      </p>
                    </div>
                    <span className="font-medium text-white">
                      {formatBRL(it.unitPrice * it.quantity)}
                    </span>
                  </div>
                  {it.deliveredContent && (
                    <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                        Entregável enviado
                      </p>
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs text-emerald-100/90">
                        {it.deliveredContent}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <span className="text-sm text-ink-400">Total</span>
              <span className="font-display text-2xl font-bold text-white">
                {formatBRL(order.total)}
              </span>
            </div>
          </div>

          {/* Delivery info */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
              Informações de entrega
            </h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-ink-400">Pagamento</dt>
                <dd className="mt-0.5 text-white">
                  {order.paymentMethod === "pix" ? "PIX" : "Manual"}
                  {order.paidAt ? (
                    <span className="ml-1.5 text-xs text-emerald-300">
                      · pago em {formatDateTime(order.paidAt)}
                    </span>
                  ) : (
                    <span className="ml-1.5 text-xs text-amber-300">
                      · não confirmado
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Método de entrega</dt>
                <dd className="mt-0.5 text-white">{order.deliveryMethod}</dd>
              </div>
              <div>
                <dt className="text-ink-400">Dados</dt>
                <dd className="mt-0.5 text-white">
                  {order.deliveryInfo || "—"}
                </dd>
              </div>
              {order.note && (
                <div className="col-span-2">
                  <dt className="text-ink-400">Observação</dt>
                  <dd className="mt-0.5 text-white">{order.note}</dd>
                </div>
              )}
            </dl>

            {order.delivery && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                <BoxIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-200">
                    Entregue {order.delivery.manual ? "manualmente (sem pagamento)" : ""}
                  </p>
                  <p className="text-emerald-200/70">
                    {formatDateTime(order.delivery.deliveredAt)}
                    {order.delivery.admin
                      ? ` · por ${order.delivery.admin.name}`
                      : ""}
                  </p>
                  {order.delivery.note && (
                    <p className="mt-1 text-emerald-200/70">
                      "{order.delivery.note}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
              Cliente
            </h3>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-700 text-white">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-white">
                  {order.user?.name ?? "Cliente convidado"}
                </p>
                <p className="text-sm text-ink-400">
                  {order.user?.email ?? "—"}
                </p>
                {order.user?.discordName && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                    <DiscordIcon className="h-3.5 w-3.5" />{" "}
                    {order.user.discordName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <OrderStatusControl orderId={order.id} current={order.status} />
          </div>
        </div>
      </div>
    </AdminContainer>
  );
}
