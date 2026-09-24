"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "AWAITING_PAYMENT", label: "Aguardando" },
  { value: "PAID", label: "Pago" },
  { value: "PREPARING", label: "Preparando" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelado" },
];

export function SalesFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const status = params.get("status") ?? "";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    router.push(`/admin/vendas?${next.toString()}`, { scroll: false });
  }

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q: q || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código ou cliente..."
          className="input pl-10"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => update({ status: s.value || null })}
            className={
              "rounded-lg px-3 py-2 text-xs font-medium transition-colors " +
              (status === s.value
                ? "bg-white text-ink-950"
                : "bg-ink-800 text-ink-300 hover:text-white")
            }
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
