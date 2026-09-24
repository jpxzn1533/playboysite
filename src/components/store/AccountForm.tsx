"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useCart } from "@/components/cart/CartProvider";
import { GoogleIcon, DiscordIcon } from "@/components/ui/icons";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_nao_configurado:
    "Login social ainda não configurado. Use e-mail e senha por enquanto.",
  provedor_invalido: "Provedor de login inválido.",
  estado_invalido: "Sessão de login expirada. Tente novamente.",
  sem_email:
    "Não foi possível obter seu e-mail nesse provedor. Use outro método.",
  login_cancelado: "Login cancelado.",
  falha_login: "Falha ao entrar. Tente novamente.",
};

export function AccountForm({
  initialMode,
  providers,
  error,
}: {
  initialMode: "login" | "register";
  providers: { google: boolean; discord: boolean };
  error?: string;
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const { toast } = useToast();
  const { refresh } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    discordName: "",
  });

  useEffect(() => {
    if (error) toast(OAUTH_ERRORS[error] ?? "Não foi possível entrar.", "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : form;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Não foi possível continuar.", "error");
        setLoading(false);
        return;
      }
      await refresh();
      toast(
        mode === "login" ? "Bem-vindo de volta!" : "Conta criada com sucesso!",
        "success"
      );
      router.refresh();
      router.push(data.role === "ADMIN" ? "/admin" : "/");
    } catch {
      toast("Erro de conexão. Tente novamente.", "error");
      setLoading(false);
    }
  }

  const hasSocial = providers.google || providers.discord;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink-950 font-display text-lg font-bold">
            P
          </span>
          <span className="font-display text-xl font-bold text-white">
            PlayBoy Store
          </span>
        </Link>
        <h1 className="mt-6 font-display text-2xl font-bold text-white">
          {mode === "login" ? "Entrar na sua conta" : "Criar sua conta"}
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          {mode === "login"
            ? "Acesse seus pedidos e finalize compras mais rápido."
            : "Cadastre-se para acompanhar seus pedidos."}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex rounded-xl border border-white/10 bg-ink-850 p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors " +
              (mode === m
                ? "bg-white text-ink-950"
                : "text-ink-300 hover:text-white")
            }
          >
            {m === "login" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      {/* Social login */}
      {hasSocial && (
        <div className="mb-5 space-y-2.5">
          {providers.google && (
            <a href="/api/auth/oauth/google" className="btn-secondary w-full py-3">
              <GoogleIcon className="h-5 w-5" />
              Continuar com Google
            </a>
          )}
          {providers.discord && (
            <a href="/api/auth/oauth/discord" className="btn-secondary w-full py-3">
              <DiscordIcon className="h-5 w-5" />
              Continuar com Discord
            </a>
          )}
          <div className="flex items-center gap-3 pt-1">
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-xs text-ink-500">ou com e-mail</span>
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>
        </div>
      )}

      <form onSubmit={submit} className="card space-y-4 p-6">
        {mode === "register" && (
          <div>
            <label className="label">Nome</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
              placeholder="Seu nome"
              required
            />
          </div>
        )}
        <div>
          <label className="label">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="input"
            placeholder="voce@email.com"
            required
          />
        </div>
        {mode === "register" && (
          <div>
            <label className="label">Usuário do Discord (opcional)</label>
            <input
              value={form.discordName}
              onChange={(e) => set("discordName", e.target.value)}
              className="input"
              placeholder="seunome"
            />
          </div>
        )}
        <div>
          <label className="label">Senha</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className="input"
            placeholder="••••••••"
            required
            minLength={mode === "register" ? 6 : undefined}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading
            ? "Aguarde..."
            : mode === "login"
              ? "Entrar"
              : "Criar conta"}
        </button>
      </form>
    </div>
  );
}
