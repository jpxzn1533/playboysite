import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/fulfill";
import { isPagbankOrderPaid } from "@/lib/pagbank";
import { logAdminAction } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // PagBank sends the order id and reference_id (our order code).
  const pagbankOrderId = String(body?.id ?? "");
  const referenceId = String(body?.reference_id ?? "");

  if (!pagbankOrderId && !referenceId) {
    return NextResponse.json({ ok: true, ignored: "no id" });
  }

  const order = await prisma.order.findFirst({
    where: pagbankOrderId
      ? { paymentHash: pagbankOrderId }
      : { code: referenceId },
  });
  if (!order) {
    return NextResponse.json({ ok: true, ignored: "order not found" });
  }

  // Never trust the webhook body alone — confirm the status with PagBank.
  const idToCheck = order.paymentHash || pagbankOrderId;
  const paid = idToCheck ? await isPagbankOrderPaid(idToCheck) : false;

  if (paid) {
    await markOrderPaid(order.id);
    await logAdminAction({
      adminName: "Sistema (PagBank)",
      action: "Pagamento confirmado via PIX",
      entityType: "Order",
      entityId: order.code,
      detail: `Pagamento do pedido ${order.code} confirmado automaticamente pelo PagBank.`,
    });
  }

  return NextResponse.json({ ok: true });
}
