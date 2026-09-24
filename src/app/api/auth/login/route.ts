import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { ensureCart } from "@/lib/cart";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
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
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.passwordHash) {
    return NextResponse.json(
      {
        error:
          "Esta conta usa login social. Entre com Google ou Discord.",
      },
      { status: 400 }
    );
  }
  if (!user || !(await verifyPassword(password, user.passwordHash!))) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  await createSession({
    userId: user.id,
    role: user.role as "CUSTOMER" | "ADMIN",
    name: user.name,
  });

  // Link current anonymous cart to the user.
  const cart = await ensureCart();
  if (!cart.userId) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { userId: user.id },
    });
  }

  return NextResponse.json({ ok: true, role: user.role });
}
