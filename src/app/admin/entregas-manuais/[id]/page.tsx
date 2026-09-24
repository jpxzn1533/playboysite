import Link from "next/link";
import { notFound } from "next/navigation";
import { getConversationForViewer } from "@/lib/chat";
import { formatBRL, formatDateTime } from "@/lib/format";
import { AdminContainer, PageHeader, BackLink } from "@/components/admin/ui";
import { ChatBox } from "@/components/chat/ChatBox";
import { ConversationControls } from "@/components/admin/ConversationControls";
import { StatusBadge } from "@/components/store/StatusBadge";
import { UserIcon, DiscordIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AdminConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const access = await getConversationForViewer(params.id);
  if (!access) notFound();

  const { conversation } = access;
  const order = conversation.order;
  const customer = conversation.user;

  return (
    <AdminContainer>
      <BackLink href="/admin/entregas-manuais" label="Voltar para entregas manuais" />
      <PageHeader
        title={`Atendimento — ${order.code}`}
        subtitle={`Aberto em ${formatDateTime(conversation.createdAt)}`}
        action={
          conversation.status === "OPEN" ? (
            <span className="badge border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              Aberto
            </span>
          ) : (
            <span className="badge border-ink-500/30 bg-ink-800 text-ink-400">
              Encerrado
            </span>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ChatBox
          conversationId={conversation.id}
          meRole="ADMIN"
          closed={conversation.status === "CLOSED"}
        />

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
              Cliente
            </h2>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-700 text-white">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-white">
                  {customer?.name ?? "Cliente"}
                </p>
                {customer?.discordName && (
                  <p className="flex items-center gap-1 text-xs text-ink-400">
                    <DiscordIcon className="h-3.5 w-3.5" /> {customer.discordName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Pedido
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-ink-300">
                    {it.quantity}× {it.name}
                    {it.variantName ? ` — ${it.variantName}` : ""}
                  </span>
                  <span className="shrink-0 text-ink-200">
                    {formatBRL(it.unitPrice * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-white/[0.06] pt-3 text-sm font-semibold text-white">
              <span>Total</span>
              <span>{formatBRL(order.total)}</span>
            </div>
            <Link
              href={`/admin/vendas/${order.id}`}
              className="btn-secondary mt-4 w-full"
            >
              Abrir pedido / alterar status
            </Link>
          </div>

          <div className="card p-5">
            <ConversationControls
              conversationId={conversation.id}
              status={conversation.status}
            />
          </div>
        </div>
      </div>
    </AdminContainer>
  );
}
