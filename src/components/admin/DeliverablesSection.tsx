"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { addDeliverables, removeDeliverable } from "@/app/admin/actions";
import { PlusIcon, TrashIcon, CheckIcon, BoxIcon } from "@/components/ui/icons";

export type DeliverableRow = {
  id: string;
  content: string;
  status: string;
  orderCode?: string | null;
};

export function DeliverablesSection({
  productId,
  variantId,
  label,
  items,
}: {
  productId: string;
  variantId: string | null;
  label?: string;
  items: DeliverableRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");

  const available = items.filter((i) => i.status === "AVAILABLE");
  const delivered = items.filter((i) => i.status !== "AVAILABLE");

  function add() {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast("Cole ao menos um entregável (um por linha).", "error");
      return;
    }
    startTransition(async () => {
      const res = await addDeliverables(productId, variantId, text);
      if (res.ok) {
        toast(`${lines.length} entregável(is) adicionado(s).`, "success");
        setText("");
        router.refresh();
      } else {
        toast(res.error ?? "Erro.", "error");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await removeDeliverable(id);
      if (res.ok) {
        toast("Entregável removido.", "info");
        router.refresh();
      } else {
        toast(res.error ?? "Erro.", "error");
      }
    });
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-ink-800 text-ink-300">
            <BoxIcon className="h-4 w-4" />
          </span>
          <h3 className="font-semibold text-white">
            {label ?? "Entregáveis"}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="badge border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            {available.length} disponível(is)
          </span>
          <span className="badge border-white/10 bg-ink-800 text-ink-400">
            {delivered.length} entregue(s)
          </span>
        </div>
      </div>

      {/* Add box */}
      <label className="label">Adicionar entregáveis (um por linha)</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={"CODIGO-1111-AAAA\nlogin:senha\nhttps://link-do-produto..."}
        className="input resize-none font-mono text-xs"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-ink-500">
          Cada linha vira 1 unidade de estoque. Entregue em ordem de cadastro.
        </p>
        <button onClick={add} disabled={pending} className="btn-primary px-4 py-2 text-sm">
          <PlusIcon className="h-4 w-4" /> Adicionar
        </button>
      </div>

      {/* Available list */}
      {available.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Disponíveis ({available.length})
          </p>
          <div className="space-y-1.5">
            {available.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-ink-900/50 px-3 py-2"
              >
                <span className="flex-1 truncate font-mono text-xs text-ink-200">
                  {d.content}
                </span>
                <button
                  onClick={() => remove(d.id)}
                  disabled={pending}
                  className="text-ink-400 transition-colors hover:text-red-300"
                  aria-label="Remover entregável"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivered list */}
      {delivered.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Entregues ({delivered.length})
          </p>
          <div className="space-y-1.5">
            {delivered.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-ink-950/40 px-3 py-2 opacity-70"
              >
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                <span className="flex-1 truncate font-mono text-xs text-ink-400 line-through">
                  {d.content}
                </span>
                {d.orderCode && (
                  <span className="shrink-0 text-[11px] text-ink-500">
                    {d.orderCode}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
