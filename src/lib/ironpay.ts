import "server-only";

const BASE_URL = "https://api.ironpayapp.com.br/api/public/v1";

export function isIronpayConfigured(): boolean {
  return Boolean(
    process.env.IRONPAY_API_TOKEN &&
      process.env.IRONPAY_OFFER_HASH &&
      process.env.IRONPAY_PRODUCT_HASH
  );
}

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

export type PixCustomer = {
  name: string;
  email: string;
  phone: string;
  document: string; // CPF
};

export type PixResult = {
  ok: boolean;
  error?: string;
  hash?: string;
  pixCode?: string;
  status?: string;
};

/**
 * Creates a PIX transaction at IronPay and returns the copy-and-paste code
 * (pix_qr_code) and the transaction hash. `amountBRL` is in reais.
 */
export async function createPixTransaction(params: {
  amountBRL: number;
  orderCode: string;
  customer: PixCustomer;
  postbackUrl: string;
}): Promise<PixResult> {
  const token = process.env.IRONPAY_API_TOKEN!;
  const offerHash = process.env.IRONPAY_OFFER_HASH!;
  const productHash = process.env.IRONPAY_PRODUCT_HASH!;

  const amount = Math.round(params.amountBRL * 100); // centavos

  const body = {
    amount,
    offer_hash: offerHash,
    payment_method: "pix",
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      phone_number: onlyDigits(params.customer.phone),
      document: onlyDigits(params.customer.document),
    },
    cart: [
      {
        product_hash: productHash,
        title: `Pedido ${params.orderCode} — PlayBoy Store`,
        cover: null,
        price: amount,
        quantity: 1,
        operation_type: 1,
        tangible: false,
      },
    ],
    expire_in_days: 1,
    transaction_origin: "api",
    postback_url: params.postbackUrl,
  };

  try {
    const res = await fetch(
      `${BASE_URL}/transactions?api_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error ||
        `Falha ao gerar PIX (HTTP ${res.status}).`;
      return { ok: false, error: String(msg) };
    }

    const hash = data.hash ?? data.transaction_hash ?? null;
    const pixCode = data?.pix?.pix_qr_code ?? data?.pix?.pix_url ?? null;
    const status = data.payment_status ?? data.status ?? "pending";

    if (!hash || !pixCode) {
      return { ok: false, error: "Resposta do gateway sem código PIX." };
    }
    return { ok: true, hash, pixCode, status };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Erro de conexão com o gateway." };
  }
}
