"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: Message[];
  isAgentTyping: boolean;
};

// Lista de mensagens da conversa; rola sozinha até a última mensagem
export function MessageList({ messages, isAgentTyping }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isAgentTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6" aria-live="polite">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isAgentTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm">
              digitando...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
