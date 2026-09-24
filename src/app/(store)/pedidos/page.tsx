import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateTime, orderStatusLabel } from "@/lib/format";
import { StatusBadge } from "@/components/store/StatusBadge";
import { Reveal } from "@/components/ui/Reveal";
import { ClipboardIcon, ArrowRightIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Meus pedidos" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container-pb py-12">
        <div className="card flex flex-col items-center gap-4 py-24 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-ink-800 text-ink-300">
            <ClipboardIcon className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Entre para ver seus pedidos
            </h1>
            <p className="mt-2 max-w-sm text-ink-400">
              Faça login na sua conta para acompanhar o status e o histórico das
              suas compras.
            </p>
          </div>
          <Link href="/conta" className="btn-primary px-6 py-3">
            Entrar na conta <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true, delivery: true, conversation: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-pb py-10 sm:py-14">
      <div className="mb-8">
        <p className="kicker">Olá, {user.name.split(" ")[0]}</p>
        <h1 className="section-title mt-1.5">Meus pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-20 text-center">
          <h3 className="text-lg font-semibold text-white">
            Você ainda não tem pedidos
          </h3>
          <p className="max-w-sm text-ink-400">
            Explore o catálogo e faça sua primeira compra.
          </p>
          <Link href="/produtos" className="btn-primary px-6 py-3">
            Explorar produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <Reveal key={order.id} delay={i * 50}>
              <div className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <div>
                    <p className="font-display text-lg font-bold text-white">
                      {order.code}
                    </p>
                    <p className="text-xs text-ink-400">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="mt-4 space-y-2">
                  {order.items.map((it) => (
                    <div key={it.id} className="text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-300">
                          {it.quantity}× {it.name}
                          {it.variantName ? ` — ${it.variantName}` : ""}
                        </span>
                        <span className="shrink-0 text-ink-200">
                          {formatBRL(it.unitPrice * it.quantity)}
                        </span>
                      </div>
                      {it.deliveredContent && (
                        <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                            Seu conteúdo entregue
                          </p>
                          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-emerald-100/90">
                            {it.deliveredContent}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                  <p className="text-sm text-ink-400">
                    {order.deliveryInfo || "Entrega via Discord"}
                  </p>
                  <p className="font-display text-lg font-bold text-white">
                    {formatBRL(order.total)}
                  </p>
                </div>

                {order.delivery && (
                  <p className="mt-3 text-xs text-emerald-300/90">
                    ✓ Entregue em {formatDateTime(order.delivery.deliveredAt)}
                    {order.delivery.manual ? " (entrega manual)" : ""}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === "AWAITING_PAYMENT" &&
                    order.paymentMethod === "pix" &&
                    order.pixCode && (
                      <Link
                        href={`/checkout/pix/${order.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-ink-100"
                      >
                        Pagar agora (PIX)
                      </Link>
                    )}
                  {order.conversation && (
                    <Link
                      href={`/pedidos/atendimento/${order.conversation.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800 px-4 py-2.5 text-sm text-white transition-colors hover:border-white/20 hover:bg-ink-750"
                    >
                      💬 {order.conversation.status === "OPEN" ? "Abrir atendimento" : "Ver atendimento"}
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
