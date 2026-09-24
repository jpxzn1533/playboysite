"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { addCartItem } from "@/app/admin/actions";
import { PlusIcon } from "@/components/ui/icons";

type Option = { value: string; label: string };

export function AddProductToCart({
  cartId,
  products,
}: {
  cartId: string;
  products: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");

  function add() {
    if (!selected) {
      toast("Selecione um produto.", "error");
      return;
    }
    const [productId, variantId] = selected.split("::");
    startTransition(async () => {
      const res = await addCartItem(cartId, productId, variantId ?? null);
      if (res.ok) {
        toast("Produto adicionado ao carrinho.", "success");
        setSelected("");
        router.refresh();
      } else {
        toast(res.error ?? "Erro.", "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="input flex-1"
      >
        <option value="" className="bg-ink-800">
          Selecionar produto para adicionar...
        </option>
        {products.map((p) => (
          <option key={p.value} value={p.value} className="bg-ink-800">
            {p.label}
          </option>
        ))}
      </select>
      <button onClick={add} disabled={pending} className="btn-secondary">
        <PlusIcon className="h-4 w-4" /> Adicionar
      </button>
    </div>
  );
}
