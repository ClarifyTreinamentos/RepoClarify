"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createId } from "@/lib/create-id";
import { createSampleConversations } from "@/lib/sample-conversations";
import type { Conversation, Message, MessageAuthor } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { EmptyState } from "./EmptyState";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { Sidebar } from "./Sidebar";

// Resposta fixa enquanto o chatbot ainda não tem inteligência artificial
const PLACEHOLDER_REPLY =
  "Ainda estou aprendendo a responder. No Dia 4 eu ganho um cérebro!";
const REPLY_DELAY_MS = 500;
const NEW_CONVERSATION_TITLE = "Nova conversa";
const TITLE_MAX_LENGTH = 50;
// De quanto em quanto tempo o "há X min" da lista é atualizado
const CLOCK_INTERVAL_MS = 30 * 1000;

function createMessage(author: MessageAuthor, text: string): Message {
  return { id: createId("msg"), author, text, sentAt: Date.now() };
}

function getLastActivity(conversation: Conversation): number {
  return conversation.messages.at(-1)?.sentAt ?? conversation.createdAt;
}

// Usa o começo da primeira mensagem como título de uma conversa nova
function titleFromText(text: string): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length > TITLE_MAX_LENGTH
    ? `${singleLine.slice(0, TITLE_MAX_LENGTH).trimEnd()}...`
    : singleLine;
}

// Tela completa do chatbot: lista de conversas à esquerda e conversa aberta à direita
export function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    createSampleConversations(Date.now()),
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(() => conversations[0]?.id ?? null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Conversas que estão esperando a resposta do atendente
  const [typingConversationIds, setTypingConversationIds] = useState<string[]>(
    [],
  );
  // "Agora" só é definido no navegador, para o servidor e o navegador renderizarem o mesmo HTML
  const [now, setNow] = useState<number | null>(null);
  const replyTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(
      () => setNow(Date.now()),
      CLOCK_INTERVAL_MS,
    );
    return () => window.clearInterval(interval);
  }, []);

  // Cancela respostas pendentes se a tela for desmontada
  useEffect(() => {
    const timeouts = replyTimeoutsRef.current;
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
  }, []);

  // Fecha a gaveta do celular com a tecla Esc
  useEffect(() => {
    if (!isSidebarOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsSidebarOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // Conversas com atividade mais recente aparecem primeiro
  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => getLastActivity(b) - getLastActivity(a),
      ),
    [conversations],
  );

  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === activeConversationId,
    ) ?? null;
  const isAgentTyping =
    activeConversation !== null &&
    typingConversationIds.includes(activeConversation.id);

  function appendMessage(conversationId: string, message: Message) {
    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const isFirstMessage = conversation.messages.length === 0;
        return {
          ...conversation,
          title:
            isFirstMessage && conversation.title === NEW_CONVERSATION_TITLE
              ? titleFromText(message.text)
              : conversation.title,
          messages: [...conversation.messages, message],
        };
      }),
    );
  }

  function handleSend(text: string) {
    if (!activeConversation || isAgentTyping) return;
    const conversationId = activeConversation.id;

    appendMessage(conversationId, createMessage("user", text));
    setNow(Date.now());
    setTypingConversationIds((current) => [...current, conversationId]);

    const timeout = window.setTimeout(() => {
      appendMessage(conversationId, createMessage("agent", PLACEHOLDER_REPLY));
      setTypingConversationIds((current) =>
        current.filter((id) => id !== conversationId),
      );
      setNow(Date.now());
    }, REPLY_DELAY_MS);
    replyTimeoutsRef.current.push(timeout);
  }

  function handleNewConversation() {
    // Reaproveita uma conversa nova que ainda está vazia, em vez de criar outra
    const emptyConversation = conversations.find(
      (conversation) => conversation.messages.length === 0,
    );

    if (emptyConversation) {
      setActiveConversationId(emptyConversation.id);
    } else {
      const conversation: Conversation = {
        id: createId("conversa"),
        customerName: "Visitante",
        customerEmail: null,
        title: NEW_CONVERSATION_TITLE,
        category: null,
        createdAt: Date.now(),
        messages: [],
      };
      setConversations((current) => [conversation, ...current]);
      setActiveConversationId(conversation.id);
      setNow(Date.now());
    }

    setIsSidebarOpen(false);
  }

  function handleSelectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setIsSidebarOpen(false);
  }

  const hasMessages =
    activeConversation !== null && activeConversation.messages.length > 0;

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar
        conversations={sortedConversations}
        activeConversationId={activeConversationId}
        now={now}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelect={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          conversation={activeConversation}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        {hasMessages ? (
          <MessageList
            messages={activeConversation.messages}
            isAgentTyping={isAgentTyping}
          />
        ) : (
          <EmptyState
            disabled={activeConversation === null || isAgentTyping}
            onSuggestionClick={handleSend}
          />
        )}

        <MessageInput
          disabled={activeConversation === null || isAgentTyping}
          onSend={handleSend}
        />
      </main>
    </div>
  );
}
