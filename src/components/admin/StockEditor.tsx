"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  adjustStock,
  setStock,
  adjustVariantStock,
  setVariantStock,
} from "@/app/admin/actions";
import { PlusIcon, MinusIcon, CheckIcon } from "@/components/ui/icons";

export function StockEditor({
  id,
  stock,
  variant = false,
}: {
  id: string;
  stock: number;
  variant?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(String(stock));
  const dirty = Number(value) !== stock;

  function bump(delta: number) {
    startTransition(async () => {
      const res = variant
        ? await adjustVariantStock(id, delta)
        : await adjustStock(id, delta);
      if (res.ok) {
        toast("Estoque atualizado.", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Erro.", "error");
      }
    });
  }

  function save() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      toast("Valor inválido.", "error");
      return;
    }
    startTransition(async () => {
      const res = variant ? await setVariantStock(id, n) : await setStock(id, n);
      if (res.ok) {
        toast("Estoque definido.", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Erro.", "error");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={() => bump(-1)}
        disabled={pending || stock <= 0}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-750 text-ink-200 transition-colors hover:bg-ink-700 disabled:opacity-30"
        aria-label="Diminuir 1"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
        className="input w-16 py-1.5 text-center"
        inputMode="numeric"
      />
      <button
        onClick={() => bump(1)}
        disabled={pending}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-750 text-ink-200 transition-colors hover:bg-ink-700"
        aria-label="Aumentar 1"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => bump(10)}
        disabled={pending}
        className="rounded-lg bg-ink-750 px-2 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:bg-ink-700"
      >
        +10
      </button>
      <button
        onClick={save}
        disabled={pending || !dirty}
        className="flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-xs font-medium text-ink-950 transition-opacity hover:bg-ink-100 disabled:opacity-30"
      >
        <CheckIcon className="h-3.5 w-3.5" /> Salvar
      </button>
    </div>
  );
}
