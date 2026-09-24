"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useCart } from "@/components/cart/CartProvider";
import { CheckIcon, ArrowRightIcon } from "@/components/ui/icons";

export function PixView({
  orderId,
  code,
  pixCode,
  qrDataUrl,
}: {
  orderId: string;
  code: string;
  pixCode: string;
  qrDataUrl: string;
}) {
  const { toast } = useToast();
  const { refresh } = useCart();
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refresh(); // cart was converted; update the badge
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paid) return;
    let stop = false;
    const check = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.paid && !stop) setPaid(true);
        }
      } catch {
        /* ignore */
      }
    };
    check();
    const t = setInterval(check, 4000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [orderId, paid]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast("Código PIX copiado!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("Não foi possível copiar. Copie manualmente.", "error");
    }
  }

  if (paid) {
    return (
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-5 p-10 text-center animate-scale-in">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckIcon className="h-8 w-8" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Pagamento confirmado!
          </h1>
          <p className="mt-3 text-ink-300">
            Recebemos o pagamento do pedido{" "}
            <span className="font-semibold text-white">{code}</span>. Você já pode
            acompanhar a entrega.
          </p>
        </div>
        <Link href="/pedidos" className="btn-primary w-full py-3">
          Ver meus pedidos <ArrowRightIcon className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6 sm:p-8">
        <div className="text-center">
          <p className="kicker">Pagamento via PIX</p>
          <h1 className="mt-1.5 font-display text-2xl font-bold text-white">
            Escaneie para pagar
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            Pedido <span className="text-ink-200">{code}</span> · aguardando
            pagamento
          </p>
        </div>

        <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR Code PIX" className="h-56 w-56" />
        </div>

        <div className="mt-6">
          <label className="label">PIX copia e cola</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={pixCode}
              className="input flex-1 font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button onClick={copy} className="btn-primary shrink-0 px-4">
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-ink-900/50 p-3 text-sm text-ink-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Aguardando confirmação do pagamento... (atualiza sozinho)
        </div>

        <ol className="mt-6 space-y-2 text-sm text-ink-400">
          <li>1. Abra o app do seu banco e escolha pagar via PIX.</li>
          <li>2. Escaneie o QR Code ou use o “copia e cola”.</li>
          <li>3. Confirme o pagamento — esta página avisa automaticamente.</li>
        </ol>

        <Link
          href="/pedidos"
          className="mt-6 block text-center text-sm text-ink-400 hover:text-white"
        >
          Pagar depois / ver meus pedidos
        </Link>
      </div>
    </div>
  );
}
