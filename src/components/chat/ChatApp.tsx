"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createId } from "@/lib/create-id";
import { streamChatReply, type ChatApiMessage } from "@/lib/chat-stream";
import type { Conversation, Message, MessageAuthor } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { EmptyState } from "./EmptyState";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { Sidebar } from "./Sidebar";

const NEW_CONVERSATION_TITLE = "Nova conversa";
const TITLE_MAX_LENGTH = 50;
// De quanto em quanto tempo o "há X min" da lista é atualizado
const CLOCK_INTERVAL_MS = 30 * 1000;

function createMessage(
  author: MessageAuthor,
  text: string,
  isError = false,
): Message {
  return { id: createId("msg"), author, text, sentAt: Date.now(), isError };
}

function createEmptyConversation(): Conversation {
  return {
    id: createId("conversa"),
    customerName: "Visitante",
    customerEmail: null,
    title: NEW_CONVERSATION_TITLE,
    category: null,
    createdAt: Date.now(),
    messages: [],
  };
}

// Converte o histórico da tela para o formato da /api/chat.
// Balões de erro são só avisos da tela e não fazem parte da conversa.
function toApiMessages(messages: Message[]): ChatApiMessage[] {
  return messages
    .filter((message) => !message.isError)
    .map((message) => ({
      role: message.author === "user" ? "user" : "assistant",
      content: message.text,
    }));
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
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    createEmptyConversation(),
  ]);
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
  // Pedidos à /api/chat em andamento, para cancelar se a tela for desmontada
  const pendingRequestsRef = useRef<Set<AbortController>>(new Set());

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
    const pendingRequests = pendingRequestsRef.current;
    return () => pendingRequests.forEach((controller) => controller.abort());
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
  // "digitando..." some assim que o primeiro pedaço da resposta aparece
  const showTypingIndicator =
    isAgentTyping && activeConversation.messages.at(-1)?.author !== "agent";

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

  function updateMessageText(
    conversationId: string,
    messageId: string,
    text: string,
  ) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id !== conversationId
          ? conversation
          : {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === messageId ? { ...message, text } : message,
              ),
            },
      ),
    );
  }

  async function handleSend(text: string) {
    if (!activeConversation || isAgentTyping) return;
    const conversationId = activeConversation.id;
    const userMessage = createMessage("user", text);
    // Histórico inteiro da conversa, incluindo a mensagem que acabou de ser enviada
    const history = toApiMessages([...activeConversation.messages, userMessage]);

    appendMessage(conversationId, userMessage);
    setNow(Date.now());
    setTypingConversationIds((current) => [...current, conversationId]);

    const controller = new AbortController();
    pendingRequestsRef.current.add(controller);

    // A mensagem do atendente só é criada quando chega o primeiro pedaço de texto
    let replyId: string | null = null;
    let replyText = "";

    await streamChatReply(
      history,
      {
        onText: (chunk) => {
          replyText += chunk;
          if (replyId === null) {
            const reply = createMessage("agent", replyText);
            replyId = reply.id;
            appendMessage(conversationId, reply);
          } else {
            updateMessageText(conversationId, replyId, replyText);
          }
        },
        onError: (message) => {
          appendMessage(conversationId, createMessage("agent", message, true));
        },
      },
      controller.signal,
    );

    pendingRequestsRef.current.delete(controller);
    if (controller.signal.aborted) return;
    setTypingConversationIds((current) =>
      current.filter((id) => id !== conversationId),
    );
    setNow(Date.now());
  }

  function handleNewConversation() {
    // Reaproveita uma conversa nova que ainda está vazia, em vez de criar outra
    const emptyConversation = conversations.find(
      (conversation) => conversation.messages.length === 0,
    );

    if (emptyConversation) {
      setActiveConversationId(emptyConversation.id);
    } else {
      const conversation = createEmptyConversation();
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
            isAgentTyping={showTypingIndicator}
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
