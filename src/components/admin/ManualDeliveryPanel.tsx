"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { manualDeliverCart, abandonCart } from "@/app/admin/actions";
import { BoltIcon, CheckIcon, ShieldIcon } from "@/components/ui/icons";

export function ManualDeliveryPanel({
  cartId,
  empty,
}: {
  cartId: string;
  empty: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  function deliver() {
    startTransition(async () => {
      const res = await manualDeliverCart(cartId, note);
      if (res.ok) {
        toast(`Entrega manual concluída — pedido ${res.code}.`, "success");
        router.push(`/admin/vendas/${res.id}`);
        router.refresh();
      } else {
        toast(res.error ?? "Não foi possível entregar.", "error");
        setConfirming(false);
      }
    });
  }

  function abandon() {
    startTransition(async () => {
      const res = await abandonCart(cartId);
      if (res.ok) {
        toast("Carrinho marcado como abandonado.", "info");
        router.push("/admin/carrinhos");
        router.refresh();
      }
    });
  }

  return (
    <div className="card p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-ink-800 text-white">
          <BoltIcon className="h-4 w-4" />
        </span>
        <h3 className="font-semibold text-white">Entrega manual</h3>
      </div>
      <p className="mb-4 text-sm text-ink-400">
        Marque este pedido como entregue <strong className="text-ink-200">sem exigir
        pagamento</strong>. O estoque será baixado e uma venda concluída será
        registrada.
      </p>

      <label className="label">Observação (opcional)</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Ex: entrega de cortesia, parceria, reposição..."
        className="input resize-none"
      />

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          disabled={pending || empty}
          className="btn-primary mt-4 w-full py-3"
        >
          <CheckIcon className="h-5 w-5" /> Entregar pedido manualmente
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-white/10 bg-ink-900 p-4">
          <p className="text-sm text-ink-200">
            Confirmar entrega manual sem pagamento?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={deliver}
              disabled={pending}
              className="btn-primary flex-1"
            >
              {pending ? "Processando..." : "Confirmar entrega"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-ink-500">
        <ShieldIcon className="h-4 w-4" />
        Ação exclusiva de administradores. Fica registrada nos logs.
      </div>

      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <button
          onClick={abandon}
          disabled={pending}
          className="btn-ghost w-full text-xs"
        >
          Marcar carrinho como abandonado
        </button>
      </div>
    </div>
  );
}
