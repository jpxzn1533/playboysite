import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/conta?next=/admin");
  if (user.role !== "ADMIN") redirect("/");

  const [openCarts, pendingOrders, openChats] = await Promise.all([
    prisma.cart.count({ where: { status: "OPEN" } }),
    prisma.order.count({
      where: { status: { in: ["AWAITING_PAYMENT", "PAID", "PREPARING"] } },
    }),
    prisma.conversation.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <AdminSidebar
        adminName={user.name}
        badges={{ carts: openCarts, orders: pendingOrders, chats: openChats }}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
