import "server-only";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "./prisma";
import { markOrderPaid } from "./fulfill";
import { logAdminAction } from "./log";

export function isImapConfigured(): boolean {
  return Boolean(
    process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS
  );
}

/** Extract BRL money values (e.g. "R$ 1.234,56" or "R$ 27,93") as numbers. */
function extractValues(text: string): number[] {
  const out: number[] = [];
  const re = /R\$\s*([\d.]{1,12},\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const normalized = m[1].replace(/\./g, "").replace(",", ".");
    const v = Number(normalized);
    if (Number.isFinite(v) && v > 0) out.push(v);
  }
  return out;
}

type Result = {
  ok: boolean;
  checked: number;
  matched: string[];
  error?: string;
};

/**
 * Diagnostic: lists recent emails (any sender) with the detected money values,
 * so we can confirm whether the bank actually emails and how it formats values.
 * Does NOT confirm anything. Shows from/subject/date only (not the body).
 */
export async function listRecentEmails(hours = 6): Promise<{
  ok: boolean;
  emails?: { from: string; subject: string; date: string; values: number[] }[];
  error?: string;
}> {
  if (!isImapConfigured()) {
    return { ok: false, error: "IMAP não configurado." };
  }
  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: { user: process.env.IMAP_USER!, pass: process.env.IMAP_PASS! },
    logger: false,
  });
  const emails: { from: string; subject: string; date: string; values: number[] }[] = [];
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - hours * 3600 * 1000);
      const uids = (await client.search({ since }, { uid: true })) || [];
      for await (const msg of client.fetch(
        uids.slice(-40),
        { source: true, envelope: true },
        { uid: true }
      )) {
        const parsed = await simpleParser(msg.source as Buffer);
        const subject = msg.envelope?.subject || "";
        emails.push({
          from: msg.envelope?.from?.[0]?.address || "",
          subject,
          date: (msg.envelope?.date || new Date()).toString(),
          values: extractValues(`${subject}\n${parsed.text || ""}`),
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
    return { ok: true, emails };
  } catch (err: any) {
    try {
      await client.logout();
    } catch {}
    const detail =
      err?.responseText || err?.code || err?.message || String(err);
    return { ok: false, error: String(detail) };
  }
}

/**
 * Connects to the inbox, reads recent messages from Nubank, and confirms any
 * pending PIX order whose unique amount matches a value in the email.
 * Idempotent: paid orders leave AWAITING_PAYMENT so re-reads won't double-confirm.
 */
export async function checkInboxAndConfirm(): Promise<Result> {
  if (!isImapConfigured()) {
    return { ok: false, checked: 0, matched: [], error: "IMAP não configurado." };
  }

  // Pending PIX orders in the last 24h, indexed by exact cents.
  const pendings = await prisma.order.findMany({
    where: {
      status: "AWAITING_PAYMENT",
      paymentMethod: "pix",
      pixAmount: { not: null },
      createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });
  const byCents = new Map<number, (typeof pendings)[number]>();
  for (const o of pendings) {
    const c = Math.round((o.pixAmount as number) * 100);
    if (!byCents.has(c)) byCents.set(c, o);
  }
  if (byCents.size === 0) {
    return { ok: true, checked: 0, matched: [] };
  }

  const fromFilter = (process.env.IMAP_FROM_FILTER || "nubank").toLowerCase();
  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: { user: process.env.IMAP_USER!, pass: process.env.IMAP_PASS! },
    logger: false,
  });

  const matched: string[] = [];
  let checked = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - 45 * 60 * 1000); // last 45 min
      const uids = (await client.search({ since }, { uid: true })) || [];
      if (uids.length) {
        for await (const msg of client.fetch(
          uids,
          { source: true, envelope: true },
          { uid: true }
        )) {
          const from = (msg.envelope?.from?.[0]?.address || "").toLowerCase();
          if (fromFilter && !from.includes(fromFilter)) continue;
          checked++;

          const parsed = await simpleParser(msg.source as Buffer);
          const text = `${msg.envelope?.subject || ""}\n${parsed.text || ""}`;
          for (const v of extractValues(text)) {
            const cents = Math.round(v * 100);
            const order = byCents.get(cents);
            if (order) {
              await markOrderPaid(order.id);
              matched.push(order.code);
              byCents.delete(cents);
              await logAdminAction({
                adminName: "Sistema (PIX / Nubank)",
                action: "Pagamento confirmado por e-mail (IMAP)",
                entityType: "Order",
                entityId: order.code,
                detail: `Valor ${v.toFixed(2)} conciliado com o pedido ${order.code}.`,
              });
            }
          }
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
    return { ok: true, checked, matched };
  } catch (err: any) {
    try {
      await client.logout();
    } catch {}
    // Surface the real IMAP reason (imapflow hides it behind "Command failed").
    const detail =
      err?.responseText ||
      err?.response ||
      err?.serverResponseCode ||
      err?.code ||
      err?.message ||
      String(err);
    const auth = err?.authenticationFailed
      ? " — FALHA DE AUTENTICAÇÃO: verifique IMAP_USER e use a SENHA DE APP em IMAP_PASS (não a senha normal); e confirme que o IMAP está ativado no e-mail."
      : "";
    return {
      ok: false,
      checked,
      matched,
      error: `${detail}${auth}`,
    };
  }
}
