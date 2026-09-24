import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { effectivePrice } from "./format";

const CART_COOKIE = "pb_cart";

/** Returns the cart token from the cookie, creating one if absent (mutates cookie). */
function readCartToken(): string | null {
  return cookies().get(CART_COOKIE)?.value ?? null;
}

export type CartWithItems = Awaited<ReturnType<typeof getCartWithItems>>;

/**
 * Get the current OPEN cart with items and product data.
 * Does NOT create a cart (safe for read-only server components).
 */
export async function getCartWithItems() {
  const token = readCartToken();
  const session = await getSession();

  let cart = null;

  if (token) {
    cart = await prisma.cart.findFirst({
      where: { token, status: "OPEN" },
      include: {
        items: {
          include: { product: { include: { images: true, category: true } } },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  // Fall back to the logged-in user's open cart if the cookie is missing.
  if (!cart && session) {
    cart = await prisma.cart.findFirst({
      where: { userId: session.userId, status: "OPEN" },
      include: {
        items: {
          include: { product: { include: { images: true, category: true } } },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  return cart;
}

/**
 * Get or create the current OPEN cart. Sets the cookie and links the user.
 * Use in route handlers / server actions where mutating cookies is allowed.
 */
export async function ensureCart() {
  let token = readCartToken();
  const session = await getSession();

  let cart = token
    ? await prisma.cart.findFirst({ where: { token, status: "OPEN" } })
    : null;

  if (!cart) {
    token = randomUUID();
    cart = await prisma.cart.create({
      data: { token, userId: session?.userId ?? null },
    });
    cookies().set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else if (session && !cart.userId) {
    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: { userId: session.userId },
    });
  }

  return cart;
}

export function computeCartTotals(
  items: { quantity: number; unitPrice: number }[]
) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return { subtotal, total: subtotal, count };
}

export async function currentUnitPrice(productId: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true, promoPrice: true },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  return effectivePrice(product);
}
