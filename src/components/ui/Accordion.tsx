"use client";

import { useState } from "react";
import { PlusIcon, MinusIcon } from "@/components/ui/icons";

export type FaqItem = { q: string; a: string };

export function Accordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={
              "card overflow-hidden transition-colors " +
              (isOpen ? "border-white/15" : "")
            }
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-white">{item.q}</span>
              <span
                className={
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors " +
                  (isOpen
                    ? "border-white/20 bg-white text-ink-950"
                    : "border-white/10 bg-ink-800 text-ink-300")
                }
              >
                {isOpen ? (
                  <MinusIcon className="h-4 w-4" />
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
              </span>
            </button>
            <div
              className={
                "grid transition-all duration-300 ease-out " +
                (isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
              }
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-ink-300">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
