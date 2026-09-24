import "server-only";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

export type ViewerRole = "ADMIN" | "CUSTOMER";

/**
 * Loads a conversation and the viewer's role, enforcing access:
 * admins can see any conversation; customers only their own.
 * Returns null when not allowed / not found / not logged in.
 */
export async function getConversationForViewer(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      order: { include: { items: true } },
      user: true,
    },
  });
  if (!conversation) return null;

  let role: ViewerRole | null = null;
  if (user.role === "ADMIN") role = "ADMIN";
  else if (conversation.userId && conversation.userId === user.id) role = "CUSTOMER";

  if (!role) return null;
  return { conversation, role, user };
}
