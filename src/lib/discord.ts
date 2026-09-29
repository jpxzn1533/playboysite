import "server-only";
import { prisma } from "./prisma";

const API = "https://discord.com/api/v10";

export function isDiscordBotConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID
  );
}

/**
 * Assigns a role to a guild member using the bot token.
 * Returns true on success. Fails gracefully (e.g. member not in the guild).
 */
export async function assignRole(
  discordUserId: string,
  roleId: string
): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId || !discordUserId || !roleId) return false;

  try {
    const res = await fetch(
      `${API}/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
          "X-Audit-Log-Reason": "Compra confirmada na PlayBoy Store",
        },
        cache: "no-store",
      }
    );
    // 204 = added, 200 also OK. 404 = member not in guild.
    return res.ok;
  } catch (err) {
    console.error("Discord assignRole error", err);
    return false;
  }
}

/**
 * Grants the relevant Discord roles for an order's buyer:
 * the optional global default role + any per-product role. Idempotent and
 * non-fatal. Requires the buyer to have logged in with Discord (discordId).
 */
export async function grantRolesForOrder(orderId: string): Promise<void> {
  if (!isDiscordBotConfigured()) return;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { discordId: true } },
        items: { include: { product: { select: { discordRoleId: true } } } },
      },
    });
    const discordId = order?.user?.discordId;
    if (!order || !discordId) return;

    const roleIds = new Set<string>();
    const defaultRole = process.env.DISCORD_DEFAULT_ROLE_ID;
    if (defaultRole) roleIds.add(defaultRole);
    for (const item of order.items) {
      const r = item.product?.discordRoleId;
      if (r) roleIds.add(r);
    }

    for (const roleId of roleIds) {
      await assignRole(discordId, roleId);
    }
  } catch (err) {
    console.error("grantRolesForOrder error", err);
  }
}
