import "server-only";

/**
 * PagBank (PagSeguro) Orders API — PIX with automatic confirmation via webhook.
 * Docs: https://developer.pagbank.com.br/reference/criar-pedido-simples
 */

function baseUrl(): string {
  return (process.env.PAGBANK_ENV || "production").toLowerCase() === "sandbox"
    ? "https://sandbox.api.pagseguro.com"
    : "https://api.pagseguro.com";
}

export function isPagbankConfigured(): boolean {
  return Boolean(process.env.PAGBANK_TOKEN && process.env.PAGBANK_TOKEN.trim());
}

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

export type PagbankCustomer = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
};

export type PagbankResult = {
  ok: boolean;
  error?: string;
  orderId?: string;
  pixCode?: string;
};

export async function createPagbankPixOrder(params: {
  amountBRL: number;
  orderCode: string;
  customer: PagbankCustomer;
  notificationUrl: string;
}): Promise<PagbankResult> {
  const token = process.env.PAGBANK_TOKEN!;
  const value = Math.round(params.amountBRL * 100); // cents

  const phoneDigits = onlyDigits(params.customer.phone);
  const area = phoneDigits.slice(0, 2);
  const number = phoneDigits.slice(2);

  const body = {
    reference_id: params.orderCode,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      tax_id: onlyDigits(params.customer.cpf),
      ...(phoneDigits.length >= 10
        ? { phones: [{ country: "55", area, number, type: "MOBILE" }] }
        : {}),
    },
    items: [
      {
        name: `Pedido ${params.orderCode} - PlayBoy Store`,
        quantity: 1,
        unit_amount: value,
      },
    ],
    qr_codes: [{ amount: { value } }],
    notification_urls: [params.notificationUrl],
  };

  try {
    const res = await fetch(`${baseUrl()}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        data?.error_messages?.[0]?.description ||
        data?.message ||
        `Falha ao gerar PIX (HTTP ${res.status}).`;
      return { ok: false, error: String(msg) };
    }

    const orderId = data.id ?? null;
    const pixCode = data?.qr_codes?.[0]?.text ?? null;
    if (!orderId || !pixCode) {
      return { ok: false, error: "Resposta do PagBank sem código PIX." };
    }
    return { ok: true, orderId, pixCode };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Erro de conexão com o PagBank." };
  }
}

/**
 * Authoritative check: fetches the order from PagBank and returns true if any
 * charge is PAID. Used by the webhook (so we never trust the webhook body alone).
 */
export async function isPagbankOrderPaid(orderId: string): Promise<boolean> {
  const token = process.env.PAGBANK_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`${baseUrl()}/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    const charges = data?.charges ?? [];
    return charges.some((c: any) => String(c?.status).toUpperCase() === "PAID");
  } catch {
    return false;
  }
}
