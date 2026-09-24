import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { ensureCart } from "@/lib/cart";
import {
  exchangeCodeForToken,
  fetchProfile,
  isProviderConfigured,
  type ProviderKey,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

function isValidProvider(p: string): p is ProviderKey {
  return p === "google" || p === "discord";
}

export async function GET(
  req: Request,
  { params }: { params: { provider: string } }
) {
  const url = new URL(req.url);
  const origin = url.origin;
  const provider = params.provider;
  const fail = (code: string) =>
    NextResponse.redirect(`${origin}/conta?erro=${code}`);

  if (!isValidProvider(provider) || !isProviderConfigured(provider)) {
    return fail("oauth_nao_configurado");
  }

  // OAuth provider may return an error (user denied, etc.)
  if (url.searchParams.get("error")) {
    return fail("login_cancelado");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stored = cookies().get("pb_oauth_state")?.value;
  cookies().delete("pb_oauth_state");

  if (!code || !state || stored !== `${provider}:${state}`) {
    return fail("estado_invalido");
  }

  try {
    const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;
    const token = await exchangeCodeForToken(provider, code, redirectUri);
    const profile = await fetchProfile(provider, token);

    if (!profile.email) {
      return fail("sem_email");
    }
    const email = profile.email.toLowerCase();

    // Match by provider identity first, then by e-mail (account linking).
    let user =
      (await prisma.user.findFirst({
        where: { provider, providerId: profile.providerId },
      })) ?? (await prisma.user.findUnique({ where: { email } }));

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: user.provider === "credentials" ? user.provider : provider,
          providerId: profile.providerId,
          avatarUrl: profile.avatarUrl ?? user.avatarUrl,
          ...(provider === "discord"
            ? { discordName: profile.discordName, discordId: profile.discordId }
            : {}),
        },
      });
    } else {
      // Bootstrap: first account (no admin yet) becomes ADMIN.
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email,
          passwordHash: null,
          role: adminCount === 0 ? "ADMIN" : "CUSTOMER",
          provider,
          providerId: profile.providerId,
          avatarUrl: profile.avatarUrl,
          discordName: profile.discordName ?? null,
          discordId: profile.discordId ?? null,
        },
      });
    }

    await createSession({
      userId: user.id,
      role: user.role as "CUSTOMER" | "ADMIN",
      name: user.name,
    });

    // Link the current anonymous cart to this user.
    const cart = await ensureCart();
    if (!cart.userId) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { userId: user.id },
      });
    }

    return NextResponse.redirect(
      `${origin}${user.role === "ADMIN" ? "/admin" : "/"}`
    );
  } catch (err) {
    console.error("OAuth callback error", err);
    return fail("falha_login");
  }
}
