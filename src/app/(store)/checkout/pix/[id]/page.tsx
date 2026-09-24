import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { PixView } from "@/components/store/PixView";

export const dynamic = "force-dynamic";

export default async function PixPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, code: true, pixCode: true, status: true },
  });

  if (!order || !order.pixCode) redirect("/pedidos");

  const qrDataUrl = await QRCode.toDataURL(order.pixCode, {
    width: 320,
    margin: 1,
  });

  return (
    <div className="container-pb py-12 sm:py-16">
      <PixView
        orderId={order.id}
        code={order.code}
        pixCode={order.pixCode}
        qrDataUrl={qrDataUrl}
      />
    </div>
  );
}
