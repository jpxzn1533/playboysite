import { orderStatusLabel, cartStatusLabel } from "@/lib/format";

const ORDER_STYLES: Record<string, string> = {
  CART_OPEN: "border-white/10 bg-ink-800 text-ink-200",
  AWAITING_PAYMENT: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  PAID: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  PREPARING: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  DELIVERED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  CANCELLED: "border-red-500/20 bg-red-500/10 text-red-300",
};

const CART_STYLES: Record<string, string> = {
  OPEN: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  CONVERTED: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  ABANDONED: "border-ink-500/30 bg-ink-800 text-ink-400",
};

export function StatusBadge({ status }: { status: string }) {
  const style = ORDER_STYLES[status] ?? "border-white/10 bg-ink-800 text-ink-200";
  return <span className={`badge ${style}`}>{orderStatusLabel(status)}</span>;
}

export function CartStatusBadge({ status }: { status: string }) {
  const style = CART_STYLES[status] ?? "border-white/10 bg-ink-800 text-ink-200";
  return <span className={`badge ${style}`}>{cartStatusLabel(status)}</span>;
}
