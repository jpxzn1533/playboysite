import { NextResponse } from "next/server";
import { checkInboxAndConfirm, listRecentEmails } from "@/lib/pix-imap";
import { diagnoseOrder } from "@/lib/diagnose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Runs the IMAP reconciliation. Call it periodically (e.g. every 1–2 min) via
 * Vercel Cron or an external cron (cron-job.org) hitting:
 *   /api/cron/pix-imap?key=CRON_SECRET
 * Vercel Cron is also accepted via the "Authorization: Bearer CRON_SECRET" header.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const key =
      url.searchParams.get("key") ||
      (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (key !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);

  // Diagnose a specific order: ?order=PB-XXXX
  const orderCode = url.searchParams.get("order");
  if (orderCode) {
    return NextResponse.json(await diagnoseOrder(orderCode));
  }

  // Diagnostic mode: ?debug=1 lists recent emails + detected values.
  if (url.searchParams.get("debug") === "1") {
    const hours = Number(url.searchParams.get("hours") || 6);
    return NextResponse.json(await listRecentEmails(hours));
  }

  const result = await checkInboxAndConfirm();
  return NextResponse.json(result);
}
