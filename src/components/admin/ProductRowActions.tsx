"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { deleteProduct, toggleProductActive } from "@/app/admin/actions";
import { TrashIcon } from "@/components/ui/icons";

export function ProductRowActions({
  id,
  active,
  name,
}: {
  id: string;
  active: boolean;
  name: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function onToggle() {
    startTransition(async () => {
      const res = await toggleProductActive(id);
      if (res.ok) {
        toast(active ? "Produto desativado." : "Produto ativado.", "info");
        router.refresh();
      } else {
        toast(res.error ?? "Erro.", "error");
      }
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res.ok) {
        toast(`"${name}" excluído.`, "info");
        router.refresh();
      } else {
        toast(res.error ?? "Erro.", "error");
      }
      setConfirming(false);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={onToggle}
        disabled={pending}
        className={
          "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors " +
          (active
            ? "bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
            : "bg-ink-700 text-ink-300 hover:bg-ink-600")
        }
      >
        {active ? "Ativo" : "Inativo"}
      </button>
      <Link
        href={`/admin/produtos/${id}`}
        className="rounded-lg bg-ink-750 px-2.5 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:bg-ink-700 hover:text-white"
      >
        Editar
      </Link>
      {confirming ? (
        <span className="flex items-center gap-1">
          <button
            onClick={onDelete}
            disabled={pending}
            className="rounded-lg bg-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30"
          >
            Confirmar
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg px-2 py-1.5 text-xs text-ink-400 hover:text-white"
          >
            ✕
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          aria-label="Excluir"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
