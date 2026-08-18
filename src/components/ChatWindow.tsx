"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markConversationRead } from "@/lib/actions/messages";

type Message = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
};

export function ChatWindow({
  conversationId,
  meId,
  initialMessages,
}: {
  conversationId: string;
  meId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Recebe mensagens novas em tempo real — funciona pros dois lados da
  // conversa (quem manda também vê a própria mensagem chegar por aqui).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="card flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-8" style={{ color: "var(--muted)" }}>
            Nenhuma mensagem ainda. Diga oi!
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender_id === meId ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[75%] rounded-2xl px-3 py-2 text-sm"
              style={{
                background: m.sender_id === meId ? "var(--blue)" : "var(--blue-lighter)",
                color: m.sender_id === meId ? "#fff" : "var(--text)",
              }}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        action={(formData: FormData) => {
          startTransition(async () => {
            await sendMessage(formData);
            formRef.current?.reset();
          });
        }}
        className="flex gap-2 p-3 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <input
          type="text"
          name="body"
          required
          placeholder="Escreva uma mensagem..."
          autoComplete="off"
          className="input-field text-sm"
        />
        <button type="submit" disabled={pending} className="btn-primary text-sm shrink-0">
          Enviar
        </button>
      </form>
    </div>
  );
}
