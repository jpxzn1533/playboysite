import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { getCurrentUser } from "@/lib/auth";

const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/playboystore";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  const user = current
    ? { id: current.id, name: current.name, role: current.role }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} discordInvite={DISCORD_INVITE} />
      <main className="flex-1">{children}</main>
      <Footer discordInvite={DISCORD_INVITE} />
    </div>
  );
}
