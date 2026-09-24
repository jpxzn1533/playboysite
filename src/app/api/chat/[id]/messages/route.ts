import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConversationForViewer } from "@/lib/chat";

export const dynamic = "force-dynamic";

const MAX_IMAGE_CHARS = 2_800_000; // ~2MB in base64
const MAX_TEXT_CHARS = 4000;

function serialize(m: {
  id: string;
  senderRole: string;
  senderName: string;
  type: string;
  content: string;
  createdAt: Date;
}) {
  return {
    id: m.id,
    senderRole: m.senderRole,
    senderName: m.senderName,
    type: m.type,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const access = await getConversationForViewer(params.id);
  if (!access) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");
  const where: any = { conversationId: params.id };
  if (after) {
    const d = new Date(after);
    if (!isNaN(d.getTime())) where.createdAt = { gt: d };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    status: access.conversation.status,
    messages: messages.map(serialize),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const access = await getConversationForViewer(params.id);
  if (!access) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }
  if (access.conversation.status === "CLOSED") {
    return NextResponse.json(
      { error: "Este atendimento foi encerrado." },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const type = body.type === "IMAGE" ? "IMAGE" : "TEXT";
  const content = String(body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }
  if (type === "IMAGE") {
    if (!content.startsWith("data:image/")) {
      return NextResponse.json({ error: "Imagem inválida." }, { status: 400 });
    }
    if (content.length > MAX_IMAGE_CHARS) {
      return NextResponse.json(
        { error: "Imagem muito grande (máx. ~2MB)." },
        { status: 413 }
      );
    }
  } else if (content.length > MAX_TEXT_CHARS) {
    return NextResponse.json(
      { error: "Mensagem muito longa." },
      { status: 413 }
    );
  }

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      senderId: access.user.id,
      senderName:
        access.role === "ADMIN" ? `${access.user.name} (equipe)` : access.user.name,
      senderRole: access.role,
      type,
      content,
    },
  });

  await prisma.conversation.update({
    where: { id: params.id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ message: serialize(message) });
}
