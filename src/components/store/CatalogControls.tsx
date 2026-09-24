"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SearchIcon, CloseIcon } from "@/components/ui/icons";

type Category = { name: string; slug: string; count: number };

const SORTS = [
  { value: "recent", label: "Mais recentes" },
  { value: "best", label: "Mais vendidos" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
];

const AVAIL = [
  { value: "all", label: "Todos" },
  { value: "in", label: "Disponível" },
  { value: "out", label: "Esgotado" },
];

export function CatalogControls({
  categories,
  total,
}: {
  categories: Category[];
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      });
      next.delete("filter");
      router.push(`/produtos?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  // Debounced search
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q: q || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeCat = params.get("categoria") ?? "";
  const activeSort = params.get("sort") ?? "recent";
  const activeAvail = params.get("disp") ?? "all";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";

  const hasFilters =
    !!activeCat ||
    activeSort !== "recent" ||
    activeAvail !== "all" ||
    !!min ||
    !!max ||
    !!q;

  return (
    <div className="space-y-4">
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos..."
            className="input pl-10"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-white"
              aria-label="Limpar busca"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={activeSort}
          onChange={(e) => update({ sort: e.target.value })}
          className="input sm:w-52"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-ink-800">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <Chip
          active={!activeCat}
          onClick={() => update({ categoria: null })}
          label="Todas"
        />
        {categories.map((c) => (
          <Chip
            key={c.slug}
            active={activeCat === c.slug}
            onClick={() => update({ categoria: c.slug })}
            label={`${c.name}`}
          />
        ))}
      </div>

      {/* Availability + price + reset */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-ink-850 p-1">
          {AVAIL.map((a) => (
            <button
              key={a.value}
              onClick={() => update({ disp: a.value === "all" ? null : a.value })}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
                ((activeAvail === a.value || (a.value === "all" && !activeAvail))
                  ? "bg-white text-ink-950"
                  : "text-ink-300 hover:text-white")
              }
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Mín R$"
            defaultValue={min}
            onBlur={(e) => update({ min: e.target.value || null })}
            className="input w-24 py-2"
          />
          <span className="text-ink-500">—</span>
          <input
            type="number"
            placeholder="Máx R$"
            defaultValue={max}
            onBlur={(e) => update({ max: e.target.value || null })}
            className="input w-24 py-2"
          />
        </div>

        <span className="ml-auto text-sm text-ink-400">
          {total} {total === 1 ? "produto" : "produtos"}
        </span>

        {hasFilters && (
          <button
            onClick={() => {
              setQ("");
              router.push("/produtos", { scroll: false });
            }}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-3.5 py-1.5 text-sm transition-all " +
        (active
          ? "border-white/20 bg-white text-ink-950"
          : "border-white/10 bg-ink-850 text-ink-300 hover:border-white/20 hover:text-white")
      }
    >
      {label}
    </button>
  );
}
