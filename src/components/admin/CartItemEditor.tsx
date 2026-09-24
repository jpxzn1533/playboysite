"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { setCartItemQty, removeCartItem } from "@/app/admin/actions";
import { PlusIcon, MinusIcon, TrashIcon } from "@/components/ui/icons";

export function CartItemEditor({
  itemId,
  quantity,
}: {
  itemId: string;
  quantity: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function change(q: number) {
    startTransition(async () => {
      const res = await setCartItemQty(itemId, q);
      if (res.ok) router.refresh();
      else toast(res.error ?? "Erro.", "error");
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await removeCartItem(itemId);
      if (res.ok) {
        toast("Item removido do carrinho.", "info");
        router.refresh();
      } else toast(res.error ?? "Erro.", "error");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-white/10 bg-ink-850">
        <button
          onClick={() => change(quantity - 1)}
          disabled={pending}
          className="flex h-8 w-8 items-center justify-center text-ink-300 hover:text-white"
          aria-label="Diminuir"
        >
          <MinusIcon className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-medium text-white">
          {quantity}
        </span>
        <button
          onClick={() => change(quantity + 1)}
          disabled={pending}
          className="flex h-8 w-8 items-center justify-center text-ink-300 hover:text-white"
          aria-label="Aumentar"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        onClick={remove}
        disabled={pending}
        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        aria-label="Remover item"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
