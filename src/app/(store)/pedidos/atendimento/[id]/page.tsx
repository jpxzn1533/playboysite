import Link from "next/link";
import { redirect } from "next/navigation";
import { getConversationForViewer } from "@/lib/chat";
import { formatBRL } from "@/lib/format";
import { ChatBox } from "@/components/chat/ChatBox";
import { StatusBadge } from "@/components/store/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AtendimentoPage({
  params,
}: {
  params: { id: string };
}) {
  const access = await getConversationForViewer(params.id);
  if (!access) redirect("/pedidos");

  const { conversation, role } = access;
  const order = conversation.order;

  return (
    <div className="container-pb py-10 sm:py-14">
      <Link
        href="/pedidos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white"
      >
        ← Voltar para meus pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Atendimento</p>
          <h1 className="section-title mt-1.5">Pedido {order.code}</h1>
          <p className="mt-2 text-sm text-ink-400">
            Fale com a nossa equipe para concluir a entrega. Você pode enviar
            textos, links e imagens.
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <ChatBox
          conversationId={conversation.id}
          meRole={role}
          closed={conversation.status === "CLOSED"}
        />

        <div className="card h-fit p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
            Itens do pedido
          </h2>
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
        </div>
      </div>
    </div>
  );
}
