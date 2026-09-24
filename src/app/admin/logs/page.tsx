import { prisma } from "@/lib/prisma";
import { formatDateTime, relativeTime } from "@/lib/format";
import { AdminContainer, PageHeader, EmptyState } from "@/components/admin/ui";
import { ClipboardIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <AdminContainer>
      <PageHeader
        title="Logs administrativos"
        subtitle="Registro de todas as ações importantes realizadas no painel."
      />

      {logs.length === 0 ? (
        <EmptyState
          title="Nenhum registro"
          desc="As ações administrativas aparecerão aqui."
        />
      ) : (
        <div className="card p-2 sm:p-4">
          <ol className="relative">
            {logs.map((log, i) => (
              <li key={log.id} className="flex gap-4 px-2 py-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-ink-300">
                    <ClipboardIcon className="h-4 w-4" />
                  </span>
                  {i < logs.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-white/[0.06]" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {log.action}
                      {log.entityId ? (
                        <span className="ml-2 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-normal text-ink-300">
                          {log.entityType} {log.entityId}
                        </span>
                      ) : null}
                    </p>
                    <span
                      className="text-xs text-ink-500"
                      title={formatDateTime(log.createdAt)}
                    >
                      {relativeTime(log.createdAt)}
                    </span>
                  </div>
                  {log.detail && (
                    <p className="mt-1 text-sm text-ink-400">{log.detail}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-500">
                    por {log.adminName} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </AdminContainer>
  );
}
