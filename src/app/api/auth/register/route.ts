import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { ensureCart } from "@/lib/cart";

const schema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  discordName: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }
  const { name, email, password, discordName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma conta com este e-mail." },
      { status: 409 }
    );
  }

  // Bootstrap: the very first account (when no admin exists yet) becomes ADMIN.
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  const role = adminCount === 0 ? "ADMIN" : "CUSTOMER";

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      discordName: discordName || null,
    },
  });

  await createSession({ userId: user.id, role, name: user.name });

  // Attach any anonymous cart to this new user.
  const cart = await ensureCart();
  if (!cart.userId) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { userId: user.id },
    });
  }

  return NextResponse.json({ ok: true, role });
}
