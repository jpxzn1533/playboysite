"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/CartProvider";
import { formatBRL } from "@/lib/format";
import {
  TrashIcon,
  PlusIcon,
  MinusIcon,
  CartIcon,
  ArrowRightIcon,
  ShieldIcon,
} from "@/components/ui/icons";

export default function CartPage() {
  const { items, subtotal, count, loading, busy, setQty, remove } = useCart();

  if (loading) {
    return (
      <div className="container-pb py-12">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 skeleton rounded-2xl" />
            ))}
          </div>
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-pb py-12">
        <div className="card flex flex-col items-center justify-center gap-4 py-24 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-ink-800 text-ink-300">
            <CartIcon className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Seu carrinho está vazio
            </h1>
            <p className="mt-2 max-w-sm text-ink-400">
              Explore o catálogo e adicione produtos para começar sua compra.
            </p>
          </div>
          <Link href="/produtos" className="btn-primary px-6 py-3">
            Explorar produtos <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-pb py-10 sm:py-14">
      <h1 className="section-title mb-8">Carrinho</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="card flex gap-4 p-3 sm:p-4 animate-fade-in"
            >
              <Link
                href={`/produtos/${item.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-900"
              >
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/produtos/${item.slug}`}
                      className="font-medium text-white hover:underline"
                    >
                      {item.name}
                    </Link>
                    {item.variantName && (
                      <span className="ml-2 rounded-md border border-white/10 bg-ink-800 px-1.5 py-0.5 text-[11px] text-ink-300">
                        {item.variantName}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    disabled={busy}
                    className="text-ink-400 transition-colors hover:text-red-300"
                    aria-label="Remover"
                  >
                    <TrashIcon className="h-4.5 w-4.5" />
                  </button>
                </div>
                <p className="mt-0.5 text-sm text-ink-400">
                  {formatBRL(item.unitPrice)} un.
                </p>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-white/10 bg-ink-850">
                    <button
                      onClick={() => setQty(item.id, item.quantity - 1)}
                      disabled={busy}
                      className="flex h-9 w-9 items-center justify-center text-ink-300 hover:text-white"
                      aria-label="Diminuir"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQty(item.id, item.quantity + 1)}
                      disabled={busy || item.quantity >= item.stock}
                      className="flex h-9 w-9 items-center justify-center text-ink-300 hover:text-white disabled:opacity-30"
                      aria-label="Aumentar"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-display font-bold text-white">
                    {formatBRL(item.lineTotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/produtos"
            className="inline-flex items-center gap-1.5 pt-2 text-sm text-ink-300 hover:text-white"
          >
            ← Continuar comprando
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white">Resumo</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-ink-300">
                <span>Itens ({count})</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Entrega</span>
                <span className="text-emerald-300">Discord</span>
              </div>
              <div className="my-2 h-px bg-white/[0.06]" />
              <div className="flex justify-between text-base font-semibold text-white">
                <span>Total</span>
                <span className="font-display text-xl">
                  {formatBRL(subtotal)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="btn-primary mt-6 w-full py-3 text-base"
            >
              Finalizar pedido <ArrowRightIcon className="h-5 w-5" />
            </Link>

            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-400">
              <ShieldIcon className="h-4 w-4" /> Compra 100% segura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
