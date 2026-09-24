"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/ui/Toast";
import { formatBRL } from "@/lib/format";
import { ArrowRightIcon, DiscordIcon } from "@/components/ui/icons";

export function CheckoutForm({
  pixMode,
  defaultName,
  defaultEmail,
}: {
  pixMode: "static" | "gateway" | null;
  defaultName: string;
  defaultEmail: string;
}) {
  const { items, subtotal, count, loading, refresh } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const pixEnabled = pixMode !== null;
  const needsPayerData = pixMode === "gateway"; // gateway requires CPF/phone
  const [method, setMethod] = useState<"pix" | "manual">(
    pixEnabled ? "pix" : "manual"
  );
  const [discord, setDiscord] = useState("");
  const [note, setNote] = useState("");
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!discord.trim()) {
      toast("Informe seu usuário do Discord para a entrega.", "error");
      return;
    }
    if (method === "pix" && needsPayerData) {
      if (!name.trim() || !email.trim()) {
        toast("Informe nome e e-mail para o PIX.", "error");
        return;
      }
      if (cpf.replace(/\D/g, "").length !== 11) {
        toast("Informe um CPF válido (11 dígitos).", "error");
        return;
      }
      if (phone.replace(/\D/g, "").length < 10) {
        toast("Informe um telefone válido (com DDD).", "error");
        return;
      }
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
          paymentMethod: method,
          name,
          email,
          cpf,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Não foi possível criar o pedido.", "error");
        setSubmitting(false);
        return;
      }
      await refresh();
      if (data.pix) {
        router.push(`/checkout/pix/${data.id}`);
      } else {
        toast("Pedido criado com sucesso.", "success");
        router.push(`/checkout/sucesso?code=${data.code}`);
      }
    } catch {
      toast("Erro de conexão. Tente novamente.", "error");
      setSubmitting(false);
    }
  }

  if (!loading && items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-white">
          Seu carrinho está vazio
        </h1>
        <p className="text-ink-400">Adicione produtos antes de finalizar.</p>
        <Link href="/produtos" className="btn-primary px-6 py-3">
          Explorar produtos
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* Payment method */}
        {pixEnabled && (
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Pagamento</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("pix")}
                className={
                  "rounded-xl border p-4 text-left transition-all " +
                  (method === "pix"
                    ? "border-white/40 bg-white/10 ring-2 ring-white/15"
                    : "border-white/10 bg-ink-850 hover:border-white/20")
                }
              >
                <span className="block text-sm font-semibold text-white">
                  PIX
                </span>
                <span className="block text-xs text-ink-400">
                  Aprovação na hora
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("manual")}
                className={
                  "rounded-xl border p-4 text-left transition-all " +
                  (method === "manual"
                    ? "border-white/40 bg-white/10 ring-2 ring-white/15"
                    : "border-white/10 bg-ink-850 hover:border-white/20")
                }
              >
                <span className="block text-sm font-semibold text-white">
                  Combinar no Discord
                </span>
                <span className="block text-xs text-ink-400">
                  Pagamento manual
                </span>
              </button>
            </div>

            {method === "pix" && needsPayerData && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Nome completo *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div>
                  <label className="label">E-mail *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="voce@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="label">CPF *</label>
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="input"
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div>
                  <label className="label">Telefone (com DDD) *</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="(11) 99999-9999"
                    inputMode="tel"
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delivery info */}
        <div className="card p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Dados de entrega
          </h2>
          <p className="mb-5 text-sm text-ink-400">
            A entrega é feita no Discord pela nossa equipe.
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
            <p className="text-sm font-medium text-white">Entrega via Discord</p>
            <p className="text-xs text-ink-400">
              {method === "pix"
                ? "Assim que o PIX for confirmado, a entrega é liberada automaticamente (ou pelo atendimento)."
                : "Após criar o pedido, nossa equipe entra em contato para concluir a entrega."}
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
            {submitting
              ? "Processando..."
              : method === "pix"
                ? "Pagar com PIX"
                : "Confirmar pedido"}
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
  );
}
