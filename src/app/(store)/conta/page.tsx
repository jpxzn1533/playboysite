import type { Metadata } from "next";
import { AccountForm } from "@/components/store/AccountForm";
import { isProviderConfigured } from "@/lib/oauth";

export const metadata: Metadata = { title: "Conta" };
export const dynamic = "force-dynamic";

export default function AccountPage({
  searchParams,
}: {
  searchParams: { modo?: string; erro?: string };
}) {
  const initialMode = searchParams.modo === "criar" ? "register" : "login";

  return (
    <div className="container-pb py-16 sm:py-24">
      <AccountForm
        initialMode={initialMode}
        providers={{
          google: isProviderConfigured("google"),
          discord: isProviderConfigured("discord"),
        }}
        error={searchParams.erro}
      />
    </div>
  );
}
