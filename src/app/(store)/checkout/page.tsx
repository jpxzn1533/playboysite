import { getCurrentUser } from "@/lib/auth";
import { isIronpayConfigured } from "@/lib/ironpay";
import { isStaticPixConfigured } from "@/lib/pix";
import { CheckoutForm } from "@/components/store/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const pixMode = isStaticPixConfigured()
    ? "static"
    : isIronpayConfigured()
      ? "gateway"
      : null;

  return (
    <div className="container-pb py-10 sm:py-14">
      <h1 className="section-title mb-8">Finalizar pedido</h1>
      <CheckoutForm
        pixMode={pixMode}
        defaultName={user?.name ?? ""}
        defaultEmail={user?.email ?? ""}
      />
    </div>
  );
}
