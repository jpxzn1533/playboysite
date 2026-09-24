import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Customer flags "I already paid" so the team knows to verify in Nubank.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, paidAt: true },
  });
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (order.status === "AWAITING_PAYMENT") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentClaimedAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
