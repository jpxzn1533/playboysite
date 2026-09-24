import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, relativeTime, formatDateTime } from "@/lib/format";
import { AdminContainer, PageHeader, EmptyState } from "@/components/admin/ui";
import { CartStatusBadge } from "@/components/store/StatusBadge";
import { ArrowRightIcon, CartIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function OpenCartsPage() {
  const carts = await prisma.cart.findMany({
    where: { status: "OPEN" },
    include: {
      user: true,
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const nonEmpty = carts.filter((c) => c.items.length > 0);

  return (
    <AdminContainer>
      <PageHeader
        title="Carrinhos abertos"
        subtitle="Acompanhe em tempo real os carrinhos ativos dos clientes e faça entregas manuais."
      />

      {nonEmpty.length === 0 ? (
        <EmptyState
          title="Nenhum carrinho aberto"
          desc="Quando um cliente adicionar produtos ao carrinho, ele aparecerá aqui."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nonEmpty.map((cart) => {
            const total = cart.items.reduce(
              (s, i) => s + i.unitPrice * i.quantity,
              0
            );
            const qty = cart.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <Link
                key={cart.id}
                href={`/admin/carrinhos/${cart.id}`}
                className="card card-hover flex flex-col p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-ink-800 text-ink-300">
                      <CartIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        #{cart.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-ink-400">
                        {cart.user?.name ?? "Convidado"}
                      </p>
                    </div>
                  </div>
                  <CartStatusBadge status={cart.status} />
                </div>

                <div className="mt-4 space-y-1.5">
                  {cart.items.slice(0, 3).map((i) => (
                    <div
                      key={i.id}
                      className="flex justify-between gap-2 text-sm text-ink-300"
                    >
                      <span className="truncate">
                        {i.quantity}× {i.product?.name ?? "Produto"}
                      </span>
                      <span className="shrink-0 text-ink-400">
                        {formatBRL(i.unitPrice * i.quantity)}
                      </span>
                    </div>
                  ))}
                  {cart.items.length > 3 && (
                    <p className="text-xs text-ink-500">
                      +{cart.items.length - 3} item(s)
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between border-t border-white/[0.06] pt-4">
                  <div>
                    <p className="text-xs text-ink-400">{qty} item(s)</p>
                    <p className="font-display text-lg font-bold text-white">
                      {formatBRL(total)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-ink-400">
                    {relativeTime(cart.updatedAt)}
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-ink-500">
                  Criado em {formatDateTime(cart.createdAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </AdminContainer>
  );
}
