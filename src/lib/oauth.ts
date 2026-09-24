import "server-only";

export type ProviderKey = "google" | "discord";

export type OAuthProfile = {
  providerId: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  discordName?: string;
  discordId?: string;
};

type ProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
  extraAuthParams?: Record<string, string>;
};

function config(provider: ProviderKey): ProviderConfig {
  if (provider === "google") {
    return {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scope: "openid email profile",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      extraAuthParams: { access_type: "online", prompt: "select_account" },
    };
  }
  return {
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    scope: "identify email",
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    extraAuthParams: { prompt: "consent" },
  };
}

export function isProviderConfigured(provider: ProviderKey): boolean {
  const c = config(provider);
  return Boolean(c.clientId && c.clientSecret);
}

export function providerLabel(provider: ProviderKey): string {
  return provider === "google" ? "Google" : "Discord";
}

export function buildAuthorizeUrl(
  provider: ProviderKey,
  redirectUri: string,
  state: string
): string {
  const c = config(provider);
  const params = new URLSearchParams({
    client_id: c.clientId ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: c.scope,
    state,
    ...(c.extraAuthParams ?? {}),
  });
  return `${c.authorizeUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  provider: ProviderKey,
  code: string,
  redirectUri: string
): Promise<string> {
  const c = config(provider);
  const body = new URLSearchParams({
    client_id: c.clientId ?? "",
    client_secret: c.clientSecret ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(c.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao obter token (${provider}): ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error(`Token ausente (${provider}).`);
  return data.access_token;
}

export async function fetchProfile(
  provider: ProviderKey,
  accessToken: string
): Promise<OAuthProfile> {
  const c = config(provider);
  const res = await fetch(c.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao obter perfil (${provider}): ${res.status} ${text}`);
  }
  const raw = await res.json();

  if (provider === "google") {
    return {
      providerId: String(raw.sub),
      email: raw.email ?? null,
      name: raw.name || raw.email || "Usuário Google",
      avatarUrl: raw.picture ?? null,
    };
  }

  // Discord
  const discordName = raw.global_name || raw.username || "Usuário Discord";
  const avatarUrl = raw.avatar
    ? `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.png`
    : null;
  return {
    providerId: String(raw.id),
    email: raw.email ?? null,
    name: discordName,
    avatarUrl,
    discordName,
    discordId: String(raw.id),
  };
}
