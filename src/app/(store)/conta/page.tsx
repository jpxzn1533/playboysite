import type { Metadata } from "next";
import { AccountForm } from "@/components/store/AccountForm";
import { ProfilePanel } from "@/components/store/ProfilePanel";
import { isProviderConfigured } from "@/lib/oauth";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Conta" };
export const dynamic = "force-dynamic";

const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/playboystore";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { modo?: string; erro?: string; next?: string };
}) {
  // Logged in → show the profile instead of the login form.
  const user = await getCurrentUser();
  if (user) {
    return (
      <div className="container-pb py-12 sm:py-16">
        <ProfilePanel
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
            discordName: user.discordName ?? null,
            avatarUrl: user.avatarUrl ?? null,
            createdAt: user.createdAt.toISOString(),
          }}
          discordInvite={DISCORD_INVITE}
        />
      </div>
    );
  }

  const initialMode = searchParams.modo === "criar" ? "register" : "login";
  // Only allow internal relative paths as redirect target.
  const next =
    searchParams.next && searchParams.next.startsWith("/")
      ? searchParams.next
      : undefined;

  return (
    <div className="container-pb py-16 sm:py-24">
      <AccountForm
        initialMode={initialMode}
        providers={{
          google: isProviderConfigured("google"),
          discord: isProviderConfigured("discord"),
        }}
        error={searchParams.erro}
        next={next}
      />
    </div>
  );
}
