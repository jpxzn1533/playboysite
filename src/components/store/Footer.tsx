import Link from "next/link";
import { DiscordIcon } from "@/components/ui/icons";

export function Footer({ discordInvite }: { discordInvite: string }) {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-ink-950/60">
      <div className="container-pb py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink-950 font-display text-lg font-bold">
                P
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                PlayBoy<span className="text-ink-400"> Store</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
              Produtos digitais e soluções para a sua comunidade. Entrega rápida,
              segura e atendimento humano direto no Discord.
            </p>
            <a
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800 px-4 py-2.5 text-sm text-white transition-colors hover:border-white/20 hover:bg-ink-750"
            >
              <DiscordIcon className="h-4 w-4" /> Entrar no Discord
            </a>
          </div>

          <FooterCol
            title="Loja"
            links={[
              { href: "/", label: "Início" },
              { href: "/produtos", label: "Produtos" },
              { href: "/carrinho", label: "Carrinho" },
              { href: "/pedidos", label: "Meus pedidos" },
            ]}
          />
          <FooterCol
            title="Comunidade"
            links={[
              { href: discordInvite, label: "Discord", external: true },
              { href: "/produtos?filter=best", label: "Mais vendidos" },
              { href: "/produtos?filter=new", label: "Novidades" },
            ]}
          />
          <FooterCol
            title="Suporte"
            links={[
              { href: discordInvite, label: "Suporte", external: true },
              { href: "/termos", label: "Termos de uso" },
              { href: "/privacidade", label: "Política de privacidade" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-ink-500 sm:flex-row">
          <p>© 2026 PlayBoy Store. Todos os direitos reservados.</p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Sistemas operando normalmente
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-300">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-400 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={l.href}
                className="text-sm text-ink-400 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
