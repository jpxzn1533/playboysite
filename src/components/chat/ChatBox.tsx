"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { ArrowRightIcon } from "@/components/ui/icons";

type ChatMessage = {
  id: string;
  senderRole: string;
  senderName: string;
  type: string;
  content: string;
  createdAt: string;
};

const POLL_MS = 3000;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a
        key={i}
        href={p}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80"
      >
        {p}
      </a>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function ChatBox({
  conversationId,
  meRole,
  closed: closedInitial,
}: {
  conversationId: string;
  meRole: "ADMIN" | "CUSTOMER";
  closed?: boolean;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [closed, setClosed] = useState(!!closedInitial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const cursorRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const append = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev];
      for (const m of incoming) if (!seen.has(m.id)) merged.push(m);
      const last = merged[merged.length - 1];
      if (last) cursorRef.current = last.createdAt;
      return merged;
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const url =
        `/api/chat/${conversationId}/messages` +
        (cursorRef.current ? `?after=${encodeURIComponent(cursorRef.current)}` : "");
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.status === "string") setClosed(data.status === "CLOSED");
      append(data.messages ?? []);
    } catch {
      /* ignore transient errors */
    } finally {
      setLoading(false);
    }
  }, [conversationId, append]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(payload: { type: "TEXT" | "IMAGE"; content: string }) {
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Não foi possível enviar.", "error");
        return false;
      }
      if (data.message) append([data.message]);
      return true;
    } catch {
      toast("Erro de conexão.", "error");
      return false;
    } finally {
      setSending(false);
    }
  }

  async function onSubmitText(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    const ok = await send({ type: "TEXT", content: value });
    if (ok) setText("");
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Selecione um arquivo de imagem.", "error");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast("Imagem muito grande (máx. 2MB).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => send({ type: "IMAGE", content: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <div className="card flex h-[560px] flex-col overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">Carregando...</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">
            Nenhuma mensagem ainda. {meRole === "ADMIN" ? "Inicie o atendimento." : "Envie uma mensagem para começar."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === meRole;
            return (
              <div
                key={m.id}
                className={"flex flex-col " + (mine ? "items-end" : "items-start")}
              >
                <span className="mb-1 px-1 text-[11px] text-ink-500">
                  {m.senderName || (m.senderRole === "ADMIN" ? "Equipe" : "Cliente")}
                </span>
                <div
                  className={
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm " +
                    (mine
                      ? "bg-white text-ink-950"
                      : "border border-white/10 bg-ink-800 text-ink-100")
                  }
                >
                  {m.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.content}
                      alt="imagem"
                      className="max-h-64 rounded-lg"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {linkify(m.content)}
                    </p>
                  )}
                </div>
                <span className="mt-1 px-1 text-[10px] text-ink-600">
                  {new Date(m.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      {closed ? (
        <div className="border-t border-white/[0.06] bg-ink-900/60 p-4 text-center text-sm text-ink-400">
          Este atendimento foi encerrado.
        </div>
      ) : (
        <form
          onSubmit={onSubmitText}
          className="flex items-end gap-2 border-t border-white/[0.06] p-3"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            className="btn-secondary shrink-0 px-3 py-2.5"
            title="Enviar imagem"
            aria-label="Enviar imagem"
          >
            {/* image icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmitText(e);
              }
            }}
            rows={1}
            placeholder="Escreva uma mensagem ou cole um link..."
            className="input max-h-32 flex-1 resize-none py-2.5"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="btn-primary shrink-0 px-4 py-2.5"
            aria-label="Enviar"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
