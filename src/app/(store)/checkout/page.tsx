import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isIronpayConfigured } from "@/lib/ironpay";
import { isPagbankConfigured } from "@/lib/pagbank";
import { isStaticPixConfigured } from "@/lib/pix";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { UserIcon, DiscordIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  // Login is required to buy.
  if (!user) {
    return (
      <div className="container-pb py-16 sm:py-24">
        <div className="card mx-auto flex max-w-md flex-col items-center gap-5 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-ink-800 text-white">
            <UserIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Entre para finalizar a compra
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              É necessário ter uma conta para comprar. Entre com Discord (ou
              e-mail) — leva alguns segundos e seu carrinho é mantido.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <Link
              href="/conta?next=/checkout&modo=criar"
              className="btn-primary w-full py-3"
            >
              <DiscordIcon className="h-5 w-5" /> Entrar / Criar conta
            </Link>
            <Link
              href="/carrinho"
              className="text-sm text-ink-400 hover:text-white"
            >
              Voltar ao carrinho
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gateway = isPagbankConfigured() || isIronpayConfigured();
  const pixMode = gateway
    ? "gateway"
    : isStaticPixConfigured()
      ? "static"
      : null;

  return (
    <div className="container-pb py-10 sm:py-14">
      <h1 className="section-title mb-8">Finalizar pedido</h1>
      <CheckoutForm
        pixMode={pixMode}
        defaultName={user?.name ?? ""}
        defaultEmail={user?.email ?? ""}
        defaultDiscord={user?.discordName ?? ""}
      />
    </div>
  );
}
