import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, relativeTime } from "@/lib/format";
import { AdminContainer, PageHeader, EmptyState } from "@/components/admin/ui";
import { ArrowRightIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ManualDeliveriesPage() {
  const conversations = await prisma.conversation.findMany({
    include: {
      order: { select: { code: true, status: true, total: true } },
      user: { select: { name: true, discordName: true } },
      _count: { select: { messages: true } },
    },
    orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }],
  });

  const open = conversations.filter((c) => c.status === "OPEN");

  return (
    <AdminContainer>
      <PageHeader
        title="Entregas manuais"
        subtitle={`${open.length} atendimento(s) aberto(s). Chats de pedidos com entrega manual.`}
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="Nenhum atendimento ainda"
          desc="Quando um cliente comprar um produto com entrega por chat, o atendimento aparece aqui."
        />
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/admin/entregas-manuais/${c.id}`}
              className="card card-hover flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-ink-800 text-lg">
                  💬
                </span>
                <div>
                  <p className="font-medium text-white">
                    {c.order?.code ?? "Pedido"}{" "}
                    <span className="text-ink-400">
                      · {c.user?.name ?? "Cliente"}
                    </span>
                  </p>
                  <p className="text-xs text-ink-400">
                    {c._count.messages} mensagem(ns) · atualizado{" "}
                    {relativeTime(c.lastMessageAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {c.status === "OPEN" ? (
                  <span className="badge border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    Aberto
                  </span>
                ) : (
                  <span className="badge border-ink-500/30 bg-ink-800 text-ink-400">
                    Encerrado
                  </span>
                )}
                <ArrowRightIcon className="h-4 w-4 text-ink-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminContainer>
  );
}
