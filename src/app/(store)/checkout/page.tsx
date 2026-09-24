"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/ui/Toast";
import { formatBRL } from "@/lib/format";
import { ArrowRightIcon, DiscordIcon } from "@/components/ui/icons";

export default function CheckoutPage() {
  const { items, subtotal, count, loading, refresh } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [discord, setDiscord] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!discord.trim()) {
      toast("Informe seu usuário do Discord para a entrega.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod: "Discord",
          deliveryInfo: `Discord: ${discord.trim()}`,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Não foi possível criar o pedido.", "error");
        setSubmitting(false);
        return;
      }
      await refresh();
      toast("Pedido criado com sucesso.", "success");
      router.push(`/checkout/sucesso?code=${data.code}`);
    } catch {
      toast("Erro de conexão. Tente novamente.", "error");
      setSubmitting(false);
    }
  }

  if (!loading && items.length === 0) {
    return (
      <div className="container-pb py-12">
        <div className="card flex flex-col items-center gap-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-white">
            Seu carrinho está vazio
          </h1>
          <p className="text-ink-400">Adicione produtos antes de finalizar.</p>
          <Link href="/produtos" className="btn-primary px-6 py-3">
            Explorar produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-pb py-10 sm:py-14">
      <h1 className="section-title mb-8">Finalizar pedido</h1>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Delivery info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">
              Dados de entrega
            </h2>
            <p className="mb-5 text-sm text-ink-400">
              A entrega é feita diretamente no Discord pela nossa equipe.
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Seu usuário do Discord *</label>
                <input
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="ex: seunome ou seunome#0000"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Observação (opcional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Alguma informação adicional para a entrega?"
                  rows={3}
                  className="input resize-none"
                />
              </div>
            </div>
          </div>

          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-ink-800 text-white">
              <DiscordIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">
                Entrega via Discord
              </p>
              <p className="text-xs text-ink-400">
                Após a criação do pedido, nossa equipe entrará em contato para
                concluir a entrega.
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white">Seu pedido</h2>
            <div className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-ink-300">
                    {i.quantity}× {i.name}
                    {i.variantName ? ` — ${i.variantName}` : ""}
                  </span>
                  <span className="shrink-0 text-white">
                    {formatBRL(i.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="my-4 h-px bg-white/[0.06]" />
            <div className="flex justify-between text-sm text-ink-300">
              <span>Itens ({count})</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="mt-3 flex justify-between text-base font-semibold text-white">
              <span>Total</span>
              <span className="font-display text-xl">{formatBRL(subtotal)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="btn-primary mt-6 w-full py-3 text-base"
            >
              {submitting ? "Criando pedido..." : "Confirmar pedido"}
              {!submitting && <ArrowRightIcon className="h-5 w-5" />}
            </button>
            <Link
              href="/carrinho"
              className="mt-3 block text-center text-sm text-ink-400 hover:text-white"
            >
              Voltar ao carrinho
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
