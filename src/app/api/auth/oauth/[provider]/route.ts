import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import {
  buildAuthorizeUrl,
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
  const provider = params.provider;
  const origin = new URL(req.url).origin;

  if (!isValidProvider(provider)) {
    return NextResponse.redirect(`${origin}/conta?erro=provedor_invalido`);
  }
  if (!isProviderConfigured(provider)) {
    return NextResponse.redirect(`${origin}/conta?erro=oauth_nao_configurado`);
  }

  const state = randomUUID();
  cookies().set("pb_oauth_state", `${provider}:${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;
  return NextResponse.redirect(buildAuthorizeUrl(provider, redirectUri, state));
}
