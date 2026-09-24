"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatBRL } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";
import { CartIcon, BoltIcon, ArrowRightIcon } from "@/components/ui/icons";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { add, busy } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const hasVariants = product.hasVariants;
  const onPromo =
    !hasVariants &&
    product.promoPrice != null &&
    product.promoPrice > 0 &&
    product.promoPrice < product.price;
  const finalPrice = hasVariants
    ? product.fromPrice
    : onPromo
      ? product.promoPrice!
      : product.price;
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;
  const discount = onPromo
    ? Math.round((1 - product.promoPrice! / product.price) * 100)
    : 0;

  async function handleAdd() {
    setAdding(true);
    await add(product.id, 1);
    setAdding(false);
  }

  async function handleBuy() {
    setBuying(true);
    const ok = await add(product.id, 1);
    setBuying(false);
    if (ok) router.push("/carrinho");
  }

  return (
    <div className="card card-hover group flex flex-col overflow-hidden">
      <Link
        href={`/produtos/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-ink-900"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className={
              "object-cover transition-transform duration-500 group-hover:scale-105 " +
              (soldOut ? "opacity-40 grayscale" : "")
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-600">
            sem imagem
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="badge border-white/15 bg-ink-950/80 text-white backdrop-blur">
              Destaque
            </span>
          )}
          {product.bestSeller && (
            <span className="badge border-white/10 bg-white/90 text-ink-950">
              Mais vendido
            </span>
          )}
          {onPromo && !soldOut && (
            <span className="badge border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              -{discount}%
            </span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-lg border border-white/15 bg-ink-950/80 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
              Produto esgotado
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wide text-ink-400">
            {product.categoryName ?? "Geral"}
          </span>
          {lowStock && (
            <span className="text-[11px] font-medium text-amber-300/90">
              Últimas {product.stock}
            </span>
          )}
        </div>

        <Link href={`/produtos/${product.slug}`}>
          <h3 className="line-clamp-1 font-medium text-white transition-colors group-hover:text-white">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-400">
          {product.shortDescription}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            {onPromo && (
              <p className="text-xs text-ink-500 line-through">
                {formatBRL(product.price)}
              </p>
            )}
            {hasVariants && (
              <p className="text-[11px] text-ink-400">A partir de</p>
            )}
            <p className="font-display text-lg font-bold text-white">
              {formatBRL(finalPrice)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {hasVariants ? (
            <Link
              href={`/produtos/${product.slug}`}
              className={(soldOut ? "btn-secondary" : "btn-primary") + " flex-1"}
            >
              {soldOut ? "Esgotado" : "Ver opções"}
              {!soldOut && <ArrowRightIcon className="h-4 w-4" />}
            </Link>
          ) : (
            <>
              <button
                onClick={handleBuy}
                disabled={soldOut || busy || buying}
                className="btn-primary flex-1"
              >
                <BoltIcon className="h-4 w-4" />
                {soldOut ? "Esgotado" : buying ? "..." : "Comprar"}
              </button>
              <button
                onClick={handleAdd}
                disabled={soldOut || busy || adding}
                className="btn-secondary px-3"
                aria-label="Adicionar ao carrinho"
                title="Adicionar ao carrinho"
              >
                <CartIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
