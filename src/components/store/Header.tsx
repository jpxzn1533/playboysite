"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  CartIcon,
  UserIcon,
  MenuIcon,
  CloseIcon,
  DiscordIcon,
  LogoutIcon,
} from "@/components/ui/icons";

type SessionUser = {
  id: string;
  name: string;
  role: string;
} | null;

const NAV = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/termos", label: "Termos" },
];

export function Header({
  user,
  discordInvite,
}: {
  user: SessionUser;
  discordInvite: string;
}) {
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <header
      className={
        "sticky top-0 z-50 transition-all duration-300 " +
        (scrolled
          ? "border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent")
      }
    >
      <div className="container-pb flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink-950 font-display text-lg font-bold shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-transform group-hover:scale-105">
            P
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            PlayBoy<span className="text-ink-400"> Store</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "relative rounded-lg px-3.5 py-2 text-sm transition-colors " +
                  (active
                    ? "text-white"
                    : "text-ink-300 hover:text-white hover:bg-white/5")
                }
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3.5 -bottom-px h-px bg-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-200 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Carrinho"
          >
            <CartIcon className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-ink-950 animate-scale-in">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* Account */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 items-center gap-2 rounded-xl px-2.5 text-ink-200 transition-colors hover:bg-white/5 hover:text-white"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[9rem] truncate text-sm sm:block">
                  {user.name.split(" ")[0]}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-white/10 bg-ink-850 p-1.5 shadow-glow animate-scale-in">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-medium text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-ink-400">
                        {user.role === "ADMIN" ? "Administrador" : "Cliente"}
                      </p>
                    </div>
                    <div className="my-1 h-px bg-white/5" />
                    <Link
                      href="/pedidos"
                      className="block rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-white/5 hover:text-white"
                    >
                      Meus pedidos
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-white/5 hover:text-white"
                      >
                        Painel administrativo
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-200 hover:bg-white/5 hover:text-white"
                    >
                      <LogoutIcon className="h-4 w-4" /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                href="/conta"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink-200 transition-colors hover:bg-white/5 hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/conta?modo=criar"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-ink-100"
              >
                <UserIcon className="h-4 w-4" /> Criar conta
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-200 hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <CloseIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-ink-950/95 backdrop-blur-xl md:hidden animate-fade-in">
          <nav className="container-pb flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white"
            >
              <DiscordIcon className="h-4 w-4" /> Entrar no Discord
            </a>
            {!user && (
              <Link
                href="/conta"
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-ink-950"
              >
                <UserIcon className="h-4 w-4" /> Entrar / Criar conta
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
