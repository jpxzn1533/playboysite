import Link from "next/link";
import { getFeaturedProducts, getStoreStats } from "@/lib/queries";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { FAQ_ITEMS } from "@/lib/faq";
import {
  ArrowRightIcon,
  BoltIcon,
  ShieldIcon,
  DiscordIcon,
  ChevronDownIcon,
} from "@/components/ui/icons";
import type { ProductCardData } from "@/lib/types";

const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/playboystore";

export default async function HomePage() {
  const [featured, stats] = await Promise.all([
    getFeaturedProducts(4),
    getStoreStats(),
  ]);

  return (
    <>
      <Hero stats={stats} />
      <HowItWorks />
      <FeaturedSection products={featured} />
      <Faq />
      <DiscordSection />
    </>
  );
}

/* ---------------- Hero ---------------- */
function Hero({
  stats,
}: {
  stats: { availableProducts: number; categories: number; deliveredOrders: number };
}) {
  const features = [
    { icon: BoltIcon, title: "Entrega rápida", sub: "Direto no Discord" },
    { icon: ShieldIcon, title: "Compra segura", sub: "Transação protegida" },
    { icon: DiscordIcon, title: "Suporte rápido", sub: "Pelo Discord" },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" />
      <div className="container-pb relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-ink-850/60 px-4 py-1.5 text-xs font-medium text-ink-200 backdrop-blur">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Online agora
              </span>
              <span className="h-3 w-px bg-white/15" />
              <span className="text-ink-300">
                {stats.deliveredOrders > 0
                  ? `+${stats.deliveredOrders} pedidos entregues`
                  : "Entrega rápida e segura"}
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.03] tracking-tight text-white sm:text-7xl">
              PlayBoy Store
              <br />
              <span className="text-ink-400">Produtos para Discord</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              Produtos digitais para a sua comunidade, com entrega rápida,
              suporte humano no Discord e os melhores preços. Tudo em um só lugar.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/produtos" className="btn-primary px-7 py-3 text-base">
                Ver produtos
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary px-7 py-3 text-base"
              >
                <DiscordIcon className="h-5 w-5" /> Discord
              </a>
            </div>
          </Reveal>

          {/* Feature cards */}
          <Reveal delay={320}>
            <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="card p-5 text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-ink-800 text-white">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {f.title}
                  </p>
                  <p className="text-xs text-ink-400">{f.sub}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Explore indicator */}
          <Reveal delay={420}>
            <a
              href="#como-funciona"
              className="mt-14 inline-flex flex-col items-center gap-2 text-ink-400 transition-colors hover:text-white"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
                Explorar
              </span>
              <ChevronDownIcon className="h-5 w-5 animate-bounce" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Escolha o produto",
      desc: "Navegue pelo catálogo e escolha o produto ideal para você.",
    },
    {
      n: "02",
      title: "Finalize o pedido",
      desc: "Adicione ao carrinho e conclua o pedido informando seu Discord.",
    },
    {
      n: "03",
      title: "Entrega no Discord",
      desc: "Nossa equipe processa e entrega o seu pedido diretamente no Discord.",
    },
    {
      n: "04",
      title: "Aproveite",
      desc: "Receba tudo funcionando e aproveite a sua experiência.",
    },
  ];

  return (
    <section id="como-funciona" className="container-pb scroll-mt-24">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="kicker">Como funciona</p>
          <h2 className="section-title mt-2">
            Tudo que você precisa, em um só lugar
          </h2>
          <p className="mt-4 text-ink-300">
            Explore a nossa plataforma completa e encontre tudo que você precisa
            em um único lugar — de assinaturas a serviços para o seu Discord.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 70}>
            <div className="card card-hover h-full p-6">
              <span className="font-display text-3xl font-bold text-ink-600">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-400">
                {s.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Featured products (shown only if any) ---------------- */
function FeaturedSection({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;
  return (
    <section className="container-pb mt-24">
      <Reveal>
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="kicker">Selecionados a dedo</p>
            <h2 className="section-title mt-1.5">Produtos em destaque</h2>
          </div>
          <Link
            href="/produtos"
            className="hidden items-center gap-1.5 text-sm text-ink-300 transition-colors hover:text-white sm:flex"
          >
            Ver todos <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i * 60}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function Faq() {
  return (
    <section className="container-pb mt-24">
      <Reveal>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="kicker">Dúvidas frequentes</p>
          <h2 className="section-title mt-2">FAQ</h2>
        </div>
      </Reveal>
      <Reveal delay={80}>
        <Accordion items={FAQ_ITEMS} />
      </Reveal>
    </section>
  );
}

/* ---------------- Discord ---------------- */
function DiscordSection() {
  return (
    <section className="container-pb mt-24">
      <Reveal>
        <div className="card flex flex-col items-center gap-6 p-10 text-center sm:p-14">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-ink-800 text-white">
            <DiscordIcon className="h-7 w-7" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Faça parte da comunidade PlayBoy
            </h3>
            <p className="mx-auto mt-3 max-w-md text-ink-300">
              Novidades, sorteios semanais, suporte rápido e ofertas exclusivas.
              Tudo acontece no nosso Discord.
            </p>
          </div>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-7 py-3 text-base"
          >
            <DiscordIcon className="h-5 w-5" /> Entrar no Discord
          </a>
        </div>
      </Reveal>
    </section>
  );
}
