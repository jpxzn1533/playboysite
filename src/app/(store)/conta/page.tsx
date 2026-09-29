import type { Metadata } from "next";
import { AccountForm } from "@/components/store/AccountForm";
import { isProviderConfigured } from "@/lib/oauth";

export const metadata: Metadata = { title: "Conta" };
export const dynamic = "force-dynamic";

export default function AccountPage({
  searchParams,
}: {
  searchParams: { modo?: string; erro?: string; next?: string };
}) {
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
