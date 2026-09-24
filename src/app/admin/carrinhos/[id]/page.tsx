import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateTime, effectivePrice } from "@/lib/format";
import { AdminContainer, PageHeader, BackLink } from "@/components/admin/ui";
import { CartStatusBadge } from "@/components/store/StatusBadge";
import { CartItemEditor } from "@/components/admin/CartItemEditor";
import { AddProductToCart } from "@/components/admin/AddProductToCart";
import { ManualDeliveryPanel } from "@/components/admin/ManualDeliveryPanel";
import { UserIcon, DiscordIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function CartDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cart = await prisma.cart.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      items: {
        include: {
          product: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
          variant: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!cart) notFound();

  const availableProducts = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      promoPrice: true,
      variants: {
        where: { active: true },
        orderBy: { position: "asc" },
        select: { id: true, name: true, price: true, promoPrice: true },
      },
    },
  });

  const productOptions = availableProducts.flatMap((p) => {
    if (p.variants.length > 0) {
      return p.variants.map((v) => ({
        value: `${p.id}::${v.id}`,
        label: `${p.name} — ${v.name} (${formatBRL(effectivePrice(v))})`,
      }));
    }
    return [
      {
        value: p.id,
        label: `${p.name} (${formatBRL(effectivePrice(p))})`,
      },
    ];
  });

  const total = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const qty = cart.items.reduce((s, i) => s + i.quantity, 0);
  const isOpen = cart.status === "OPEN";

  return (
    <AdminContainer>
      <BackLink href="/admin/carrinhos" label="Voltar para carrinhos" />
      <PageHeader
        title={`Carrinho #${cart.id.slice(-6).toUpperCase()}`}
        subtitle={`${qty} item(s) · Atualizado em ${formatDateTime(cart.updatedAt)}`}
        action={<CartStatusBadge status={cart.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: items + customer */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
              Cliente
            </h3>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-700 text-white">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-white">
                  {cart.user?.name ?? "Cliente convidado"}
                </p>
                <p className="text-sm text-ink-400">
                  {cart.user?.email ?? "Sem conta vinculada"}
                </p>
                {cart.user?.discordName && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                    <DiscordIcon className="h-3.5 w-3.5" /> {cart.user.discordName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">
              Produtos no carrinho
            </h3>

            {cart.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">
                Este carrinho está vazio.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                      {item.product?.images[0] && (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {item.product?.name ?? "Produto removido"}
                        {item.variant && (
                          <span className="ml-2 rounded-md border border-white/10 bg-ink-800 px-1.5 py-0.5 text-[11px] text-ink-300">
                            {item.variant.name}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-ink-400">
                        {formatBRL(item.unitPrice)} un. ·{" "}
                        {formatBRL(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                    {isOpen ? (
                      <CartItemEditor itemId={item.id} quantity={item.quantity} />
                    ) : (
                      <span className="text-sm text-ink-300">
                        {item.quantity}×
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isOpen && (
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <p className="label">Adicionar produto ao carrinho</p>
                <AddProductToCart cartId={cart.id} products={productOptions} />
              </div>
            )}
          </div>
        </div>

        {/* Right: summary + manual delivery */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 font-semibold text-white">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-300">
                <span>Itens</span>
                <span>{qty}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Criado em</span>
                <span>{formatDateTime(cart.createdAt)}</span>
              </div>
              <div className="my-2 h-px bg-white/[0.06]" />
              <div className="flex justify-between text-base font-semibold text-white">
                <span>Total</span>
                <span className="font-display text-xl">{formatBRL(total)}</span>
              </div>
            </div>
          </div>

          {isOpen ? (
            <ManualDeliveryPanel cartId={cart.id} empty={cart.items.length === 0} />
          ) : (
            <div className="card p-6 text-sm text-ink-400">
              Este carrinho já foi processado ({cart.status.toLowerCase()}).
            </div>
          )}
        </div>
      </div>
    </AdminContainer>
  );
}
