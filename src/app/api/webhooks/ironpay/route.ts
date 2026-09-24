import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/fulfill";
import { logAdminAction } from "@/lib/log";

export const dynamic = "force-dynamic";

const PAID = new Set(["paid", "approved", "confirmed"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // Optional shared-secret check (set IRONPAY_WEBHOOK_TOKEN to enable).
  const expected = process.env.IRONPAY_WEBHOOK_TOKEN;
  if (expected && String(body.token ?? "") !== expected) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const hash = String(body.transaction_hash ?? body.hash ?? "");
  const status = String(body.status ?? body.payment_status ?? "").toLowerCase();

  if (!hash) {
    return NextResponse.json({ ok: true, ignored: "no hash" });
  }

  const order = await prisma.order.findFirst({ where: { paymentHash: hash } });
  if (!order) {
    // Unknown transaction — acknowledge so the gateway stops retrying.
    return NextResponse.json({ ok: true, ignored: "order not found" });
  }

  if (PAID.has(status)) {
    await markOrderPaid(order.id);
    await logAdminAction({
      adminName: "Sistema (PIX)",
      action: "Pagamento confirmado via PIX",
      entityType: "Order",
      entityId: order.code,
      detail: `Pagamento do pedido ${order.code} confirmado automaticamente pelo IronPay.`,
    });
  }

  return NextResponse.json({ ok: true });
}
