"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChartIcon,
  BoxIcon,
  LayersIcon,
  CartIcon,
  TagIcon,
  UsersIcon,
  ClipboardIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/ui/icons";

type Badges = { carts: number; orders: number };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: ChartIcon, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: BoxIcon },
  { href: "/admin/estoque", label: "Estoque", icon: LayersIcon },
  { href: "/admin/carrinhos", label: "Carrinhos abertos", icon: CartIcon, badge: "carts" as const },
  { href: "/admin/vendas", label: "Vendas", icon: TagIcon, badge: "orders" as const },
  { href: "/admin/clientes", label: "Clientes", icon: UsersIcon },
  { href: "/admin/logs", label: "Logs", icon: ClipboardIcon },
];

export function AdminSidebar({
  adminName,
  badges,
}: {
  adminName: string;
  badges: Badges;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const count = item.badge ? badges[item.badge] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors " +
              (active
                ? "bg-white/10 text-white"
                : "text-ink-300 hover:bg-white/5 hover:text-white")
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-ink-950">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-ink-950/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-ink-950 font-display font-bold">
            P
          </span>
          <span className="font-display font-bold text-white">Admin</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-200 hover:bg-white/5"
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-b border-white/[0.06] bg-ink-950 py-3 lg:hidden animate-fade-in">
          {nav}
          <div className="mt-2 px-3">
            <button onClick={logout} className="btn-ghost w-full justify-start">
              <LogoutIcon className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[0.06] bg-ink-950/60 py-6 lg:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-2.5 px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink-950 font-display text-lg font-bold">
            P
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-white">
              PlayBoy Store
            </p>
            <p className="text-[11px] text-ink-400">Painel administrativo</p>
          </div>
        </Link>

        {nav}

        <div className="mt-4 border-t border-white/[0.06] px-3 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-300 hover:bg-white/5 hover:text-white"
          >
            <BoxIcon className="h-4.5 w-4.5" /> Ver a loja
          </Link>
          <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white">
              {adminName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{adminName}</p>
              <p className="text-[11px] text-ink-400">Administrador</p>
            </div>
            <button
              onClick={logout}
              className="text-ink-400 hover:text-white"
              aria-label="Sair"
              title="Sair"
            >
              <LogoutIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
