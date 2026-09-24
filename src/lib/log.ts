import "server-only";
import { prisma } from "./prisma";

type LogInput = {
  adminId?: string | null;
  adminName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
};

export async function logAdminAction(input: LogInput) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId: input.adminId ?? null,
        adminName: input.adminName ?? "Sistema",
        action: input.action,
        entityType: input.entityType ?? "",
        entityId: input.entityId ?? "",
        detail: input.detail ?? "",
      },
    });
  } catch (err) {
    // Logging must never break the main flow.
    console.error("Failed to write admin log", err);
  }
}

export function generateOrderCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  const t = Date.now().toString().slice(-4);
  return `PB-${t}${n}`;
}
