import "server-only";

/**
 * Static PIX (BR Code / "copia e cola") generator — points straight to your
 * Nubank (or any) PIX key. No gateway, no fees beyond your bank's. Payment
 * confirmation is manual (the bank does not notify the site).
 */

export function isStaticPixConfigured(): boolean {
  return Boolean(process.env.PIX_KEY && process.env.PIX_KEY.trim());
}

function normalizeText(s: string, max: number): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, max);
}

function sanitizeTxid(s: string): string {
  const clean = (s || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
  return clean || "***";
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Builds the PIX copy-and-paste string for a given amount (in BRL) and txid.
 */
export function buildStaticPix(params: {
  amountBRL: number;
  txid: string;
}): string {
  const key = (process.env.PIX_KEY || "").trim();
  const name = normalizeText(process.env.PIX_MERCHANT_NAME || "PLAYBOY STORE", 25);
  const city = normalizeText(process.env.PIX_MERCHANT_CITY || "SAO PAULO", 15);

  const merchantAccount = tlv(
    "26",
    tlv("00", "br.gov.bcb.pix") + tlv("01", key)
  );
  const amount = params.amountBRL > 0 ? tlv("54", params.amountBRL.toFixed(2)) : "";
  const additional = tlv("62", tlv("05", sanitizeTxid(params.txid)));

  const payload =
    tlv("00", "01") +
    tlv("01", "12") + // cobrança única com valor
    merchantAccount +
    tlv("52", "0000") +
    tlv("53", "986") +
    amount +
    tlv("58", "BR") +
    tlv("59", name || "PLAYBOY STORE") +
    tlv("60", city || "SAO PAULO") +
    additional +
    "6304";

  return payload + crc16(payload);
}
