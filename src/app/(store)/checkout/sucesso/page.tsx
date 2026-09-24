import Link from "next/link";
import { CheckIcon, DiscordIcon, ArrowRightIcon } from "@/components/ui/icons";

const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/playboystore";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams.code ?? "";

  return (
    <div className="container-pb py-16 sm:py-24">
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-5 p-10 text-center animate-scale-in">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-950">
          <CheckIcon className="h-8 w-8" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Pedido criado com sucesso!
          </h1>
          <p className="mt-3 text-ink-300">
            Recebemos seu pedido e nossa equipe fará a entrega no Discord em
            breve.
          </p>
        </div>

        {code && (
          <div className="w-full rounded-xl border border-white/10 bg-ink-900 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-ink-400">
              Código do pedido
            </p>
            <p className="mt-1 font-display text-xl font-bold text-white">
              {code}
            </p>
          </div>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 py-3"
          >
            <DiscordIcon className="h-5 w-5" /> Ir para o Discord
          </a>
          <Link href="/pedidos" className="btn-secondary flex-1 py-3">
            Meus pedidos <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
        <Link href="/produtos" className="text-sm text-ink-400 hover:text-white">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
