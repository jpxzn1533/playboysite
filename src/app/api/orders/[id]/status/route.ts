import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { status: true, paidAt: true, paymentMethod: true },
  });
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    status: order.status,
    paid: order.status === "PAID" || order.status === "DELIVERED",
    paidAt: order.paidAt,
  });
}
