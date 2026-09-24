"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { updateOrderStatus } from "@/app/admin/actions";
import { orderStatusLabel } from "@/lib/format";

const FLOW = ["AWAITING_PAYMENT", "PAID", "PREPARING", "DELIVERED", "CANCELLED"];

export function OrderStatusControl({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function go(status: string) {
    if (status === current) return;
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status);
      if (res.ok) {
        toast(`Status alterado para "${orderStatusLabel(status)}".`, "success");
        router.refresh();
      } else {
        toast(res.error ?? "Erro ao alterar status.", "error");
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="label">Alterar status</p>
      <div className="grid grid-cols-2 gap-2">
        {FLOW.map((s) => {
          const active = s === current;
          const danger = s === "CANCELLED";
          return (
            <button
              key={s}
              onClick={() => go(s)}
              disabled={pending || active}
              className={
                "rounded-lg px-3 py-2 text-xs font-medium transition-colors " +
                (active
                  ? "bg-white text-ink-950"
                  : danger
                    ? "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    : "bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-white")
              }
            >
              {orderStatusLabel(s)}
            </button>
          );
        })}
      </div>
      {pending && <p className="text-xs text-ink-400">Atualizando...</p>}
    </div>
  );
}
