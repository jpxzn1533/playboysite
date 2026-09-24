"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { setConversationStatus } from "@/app/admin/actions";

export function ConversationControls({
  conversationId,
  status,
}: {
  conversationId: string;
  status: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function toggle(next: "OPEN" | "CLOSED") {
    startTransition(async () => {
      const res = await setConversationStatus(conversationId, next);
      if (res.ok) {
        toast(next === "CLOSED" ? "Atendimento encerrado." : "Atendimento reaberto.", "info");
        router.refresh();
      } else {
        toast(res.error ?? "Erro.", "error");
      }
    });
  }

  return status === "OPEN" ? (
    <button
      onClick={() => toggle("CLOSED")}
      disabled={pending}
      className="btn-secondary w-full"
    >
      Encerrar atendimento
    </button>
  ) : (
    <button
      onClick={() => toggle("OPEN")}
      disabled={pending}
      className="btn-secondary w-full"
    >
      Reabrir atendimento
    </button>
  );
}
