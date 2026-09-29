"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/format";
import {
  DiscordIcon,
  ClipboardIcon,
  ChartIcon,
  LogoutIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

export function ProfilePanel({
  user,
  discordInvite,
}: {
  user: {
    name: string;
    email: string;
    role: string;
    discordName: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
  discordInvite: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="kicker">Sua conta</p>
        <h1 className="section-title mt-1.5">Meu perfil</h1>
      </div>

      {/* Identity */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={user.name} className="h-16 w-16" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold text-white">
              {user.name}
            </p>
            <p className="truncate text-sm text-ink-400">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {user.discordName && (
                <span className="badge border-white/10 bg-ink-800 text-ink-200">
                  <DiscordIcon className="h-3.5 w-3.5" /> {user.discordName}
                </span>
              )}
              <span className="badge border-white/10 bg-ink-800 text-ink-300">
                {user.role === "ADMIN" ? "Administrador" : "Cliente"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 text-sm">
          <div>
            <p className="text-ink-400">Cliente desde</p>
            <p className="mt-0.5 text-white">{formatDate(user.createdAt)}</p>
          </div>
          {!user.discordName && (
            <div>
              <p className="text-ink-400">Discord</p>
              <a
                href={discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-white hover:underline"
              >
                <DiscordIcon className="h-3.5 w-3.5" /> Entrar no servidor
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href="/pedidos"
          className="card card-hover flex items-center gap-3 p-5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-ink-800 text-white">
            <ClipboardIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-medium text-white">Meus pedidos</p>
            <p className="text-xs text-ink-400">Acompanhe suas compras</p>
          </div>
          <ArrowRightIcon className="h-4 w-4 text-ink-400" />
        </Link>

        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="card card-hover flex items-center gap-3 p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-ink-800 text-white">
              <ChartIcon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium text-white">Painel administrativo</p>
              <p className="text-xs text-ink-400">Gerenciar a loja</p>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-ink-400" />
          </Link>
        )}
      </div>

      <button
        onClick={logout}
        disabled={pending}
        className="btn-secondary mt-4 w-full py-3"
      >
        <LogoutIcon className="h-4 w-4" /> {pending ? "Saindo..." : "Sair da conta"}
      </button>
    </div>
  );
}
