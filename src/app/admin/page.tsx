import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateTime, relativeTime } from "@/lib/format";
import {
  AdminContainer,
  AdminCard,
  PageHeader,
  StatCard,
} from "@/components/admin/ui";
import {
  RevenueChart,
  OrdersChart,
  TopProductsChart,
} from "@/components/admin/DashboardCharts";
import { StatusBadge } from "@/components/store/StatusBadge";
import {
  TagIcon,
  CartIcon,
  BoxIcon,
  AlertIcon,
  ChartIcon,
  ClipboardIcon,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const REVENUE_STATUSES = ["PAID", "PREPARING", "DELIVERED"];

export default async function AdminDashboard() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 13);
  start.setHours(0, 0, 0, 0);

  const [
    allOrders,
    recentOrders,
    products,
    openCarts,
    pendingCount,
    completedCount,
    orderItems,
    recentLogs,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start } },
      include: { delivery: true },
    }),
    prisma.order.findMany({
      include: { user: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.product.findMany(),
    prisma.cart.count({ where: { status: "OPEN" } }),
    prisma.order.count({
      where: { status: { in: ["AWAITING_PAYMENT", "PAID", "PREPARING"] } },
    }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.orderItem.groupBy({
      by: ["name"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  // Revenue counts confirmed, non-manual sales.
  const allRevenueOrders = await prisma.order.findMany({
    where: { status: { in: REVENUE_STATUSES } },
    include: { delivery: true },
  });
  const revenue = allRevenueOrders
    .filter((o) => !o.delivery?.manual)
    .reduce((s, o) => s + o.total, 0);
  const salesCount = allRevenueOrders.length;

  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
  ).length;

  // Build 14-day series.
  const days: { label: string; receita: number; pedidos: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      receita: 0,
      pedidos: 0,
    });
  }
  for (const o of allOrders) {
    const idx = Math.floor(
      (new Date(o.createdAt).setHours(0, 0, 0, 0) - start.getTime()) / 86400000
    );
    if (idx >= 0 && idx < 14) {
      days[idx].pedidos += 1;
      if (REVENUE_STATUSES.includes(o.status) && !o.delivery?.manual) {
        days[idx].receita += o.total;
      }
    }
  }

  const topProducts = orderItems.map((oi) => ({
    name: oi.name.length > 22 ? oi.name.slice(0, 20) + "…" : oi.name,
    vendas: oi._sum.quantity ?? 0,
  }));

  return (
    <AdminContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do desempenho da PlayBoy Store."
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Faturamento"
          value={formatBRL(revenue)}
          hint="Vendas pagas e concluídas"
          icon={<ChartIcon className="h-4 w-4" />}
          accent="good"
        />
        <StatCard
          label="Vendas"
          value={String(salesCount)}
          hint="Pedidos confirmados"
          icon={<TagIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Pedidos pendentes"
          value={String(pendingCount)}
          hint="Aguardando conclusão"
          icon={<ClipboardIcon className="h-4 w-4" />}
          accent={pendingCount > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Carrinhos abertos"
          value={String(openCarts)}
          hint="Em tempo real"
          icon={<CartIcon className="h-4 w-4" />}
        />
      </div>

      {/* Secondary stats */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Pedidos concluídos"
          value={String(completedCount)}
          icon={<BoxIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Produtos cadastrados"
          value={String(products.length)}
          icon={<BoxIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Estoque baixo"
          value={String(lowStock)}
          icon={<AlertIcon className="h-4 w-4" />}
          accent={lowStock > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Produtos esgotados"
          value={String(outOfStock)}
          icon={<AlertIcon className="h-4 w-4" />}
          accent={outOfStock > 0 ? "danger" : "default"}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Receita (14 dias)</h3>
            <span className="text-xs text-ink-400">{formatBRL(revenue)} no total</span>
          </div>
          <RevenueChart data={days} />
        </AdminCard>
        <AdminCard>
          <h3 className="mb-4 font-semibold text-white">Produtos mais vendidos</h3>
          <TopProductsChart data={topProducts} />
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <AdminCard>
          <h3 className="mb-4 font-semibold text-white">Pedidos por dia</h3>
          <OrdersChart data={days} />
        </AdminCard>

        {/* Recent orders */}
        <AdminCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Pedidos recentes</h3>
            <Link href="/admin/vendas" className="text-xs text-ink-400 hover:text-white">
              Ver todos
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">
              Nenhum pedido ainda.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/vendas/${o.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-white/[0.02] -mx-2 px-2 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {o.code}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {o.user?.name ?? "Convidado"} · {o.items.length} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-sm text-ink-200 sm:block">
                      {formatBRL(o.total)}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      {/* Recent activity */}
      <AdminCard className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">Atividade recente</h3>
          <Link href="/admin/logs" className="text-xs text-ink-400 hover:text-white">
            Ver logs
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">Sem atividades.</p>
        ) : (
          <ul className="space-y-3">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-500" />
                <div className="flex-1">
                  <p className="text-ink-200">
                    <span className="font-medium text-white">{log.adminName}</span>{" "}
                    — {log.action}
                    {log.entityId ? ` (${log.entityId})` : ""}
                  </p>
                  {log.detail && (
                    <p className="text-xs text-ink-400">{log.detail}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-ink-500">
                  {relativeTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminContainer>
  );
}
