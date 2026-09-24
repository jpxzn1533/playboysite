"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatBRL, effectivePrice } from "@/lib/format";
import {
  CartIcon,
  BoltIcon,
  PlusIcon,
  MinusIcon,
  ShieldIcon,
  BoxIcon,
  CheckIcon,
} from "@/components/ui/icons";

export type DetailVariant = {
  id: string;
  name: string;
  price: number;
  promoPrice: number | null;
  stock: number;
};

export type DetailProduct = {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  soldCount: number;
  categoryName: string | null;
  images: string[];
  variants: DetailVariant[];
};

export function ProductDetail({ product }: { product: DetailProduct }) {
  const { add, busy } = useCart();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const hasVariants = product.variants.length > 0;
  const [variantId, setVariantId] = useState<string | null>(
    hasVariants
      ? (product.variants.find((v) => v.stock > 0) ?? product.variants[0]).id
      : null
  );
  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? null,
    [product.variants, variantId]
  );

  const source = selectedVariant ?? product;
  const onPromo =
    source.promoPrice != null &&
    source.promoPrice > 0 &&
    source.promoPrice < source.price;
  const finalPrice = effectivePrice(source);
  const stock = hasVariants ? selectedVariant?.stock ?? 0 : product.stock;
  const soldOut = stock <= 0;
  const lowStock = !soldOut && stock <= 5;
  const discount = onPromo
    ? Math.round((1 - source.promoPrice! / source.price) * 100)
    : 0;
  const images = product.images.length ? product.images : [null];

  const clampQty = (n: number) => Math.max(1, Math.min(stock || 1, n));

  function selectVariant(id: string) {
    setVariantId(id);
    setQty(1);
  }

  async function handleAdd() {
    setAdding(true);
    await add(product.id, qty, variantId);
    setAdding(false);
  }
  async function handleBuy() {
    setBuying(true);
    const ok = await add(product.id, qty, variantId);
    setBuying(false);
    if (ok) router.push("/carrinho");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-900">
          {images[active] ? (
            <Image
              src={images[active] as string}
              alt={product.name}
              fill
              priority
              sizes="(max-width:1024px) 100vw, 50vw"
              className={"object-cover " + (soldOut ? "opacity-50 grayscale" : "")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-600">
              sem imagem
            </div>
          )}
          {onPromo && !soldOut && (
            <span className="badge absolute left-4 top-4 border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              -{discount}%
            </span>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-xl border border-white/15 bg-ink-950/80 px-4 py-2 font-semibold text-white backdrop-blur">
                {hasVariants ? "Opção esgotada" : "Produto esgotado"}
              </span>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={
                  "relative aspect-square overflow-hidden rounded-xl border transition-all " +
                  (active === i
                    ? "border-white/40 ring-2 ring-white/20"
                    : "border-white/[0.06] opacity-70 hover:opacity-100")
                }
              >
                {img && (
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {product.categoryName && (
          <span className="kicker">{product.categoryName}</span>
        )}
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-3 text-ink-300">{product.shortDescription}</p>

        <div className="mt-6 flex items-end gap-3">
          <span className="font-display text-4xl font-bold text-white">
            {formatBRL(finalPrice)}
          </span>
          {onPromo && (
            <span className="mb-1 text-lg text-ink-500 line-through">
              {formatBRL(source.price)}
            </span>
          )}
        </div>

        {/* Variation selector */}
        {hasVariants && (
          <div className="mt-6">
            <p className="label">Escolha uma opção</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const vSoldOut = v.stock <= 0;
                const isActive = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    onClick={() => !vSoldOut && selectVariant(v.id)}
                    disabled={vSoldOut}
                    className={
                      "rounded-xl border px-4 py-2.5 text-left transition-all " +
                      (isActive
                        ? "border-white/40 bg-white/10 ring-2 ring-white/15"
                        : vSoldOut
                          ? "cursor-not-allowed border-white/[0.06] bg-ink-900 opacity-40"
                          : "border-white/10 bg-ink-850 hover:border-white/20")
                    }
                  >
                    <span className="block text-sm font-medium text-white">
                      {v.name}
                    </span>
                    <span className="block text-xs text-ink-400">
                      {vSoldOut ? "Esgotado" : formatBRL(effectivePrice(v))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Availability */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {soldOut ? (
            <span className="badge border-red-500/20 bg-red-500/10 text-red-300">
              Esgotado
            </span>
          ) : lowStock ? (
            <span className="badge border-amber-400/20 bg-amber-400/10 text-amber-300">
              Últimas {stock} unidades
            </span>
          ) : (
            <span className="badge border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <CheckIcon className="h-3 w-3" /> Em estoque
            </span>
          )}
          <span className="badge border-white/10 bg-ink-800 text-ink-300">
            {product.soldCount} vendidos
          </span>
        </div>

        {/* Quantity */}
        {!soldOut && (
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-white/10 bg-ink-850">
              <button
                onClick={() => setQty((q) => clampQty(q - 1))}
                className="flex h-11 w-11 items-center justify-center text-ink-300 hover:text-white disabled:opacity-30"
                disabled={qty <= 1}
                aria-label="Diminuir"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium text-white">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => clampQty(q + 1))}
                className="flex h-11 w-11 items-center justify-center text-ink-300 hover:text-white disabled:opacity-30"
                disabled={qty >= stock}
                aria-label="Aumentar"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleBuy}
            disabled={soldOut || busy || buying}
            className="btn-primary flex-1 py-3 text-base"
          >
            <BoltIcon className="h-5 w-5" />
            {soldOut ? "Indisponível" : buying ? "Processando..." : "Comprar agora"}
          </button>
          <button
            onClick={handleAdd}
            disabled={soldOut || busy || adding}
            className="btn-secondary flex-1 py-3 text-base"
          >
            <CartIcon className="h-5 w-5" />
            {adding ? "Adicionando..." : "Adicionar ao carrinho"}
          </button>
        </div>

        {/* Trust */}
        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-850/60 p-3">
            <ShieldIcon className="h-5 w-5 text-ink-300" />
            <div>
              <p className="text-sm font-medium text-white">Compra segura</p>
              <p className="text-xs text-ink-400">Transação protegida</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-850/60 p-3">
            <BoxIcon className="h-5 w-5 text-ink-300" />
            <div>
              <p className="text-sm font-medium text-white">Entrega no Discord</p>
              <p className="text-xs text-ink-400">Rápida e acompanhada</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-300">
            Descrição
          </h2>
          <p className="whitespace-pre-line leading-relaxed text-ink-300">
            {product.description || product.shortDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
