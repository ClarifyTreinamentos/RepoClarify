import { formatRelativeTime } from "@/lib/format-relative-time";
import type { Conversation } from "@/types/chat";
import { CategoryBadge } from "./CategoryBadge";

type ConversationListItemProps = {
  conversation: Conversation;
  isActive: boolean;
  // null enquanto a página ainda não carregou no navegador (evita diferença entre servidor e navegador)
  now: number | null;
  onSelect: (conversationId: string) => void;
};

// Um item da lista lateral: nome, começo da última mensagem, tempo e categoria
export function ConversationListItem({
  conversation,
  isActive,
  now,
  onSelect,
}: ConversationListItemProps) {
  const lastMessage = conversation.messages.at(-1);
  const lastActivity = lastMessage?.sentAt ?? conversation.createdAt;
  const preview = lastMessage?.text ?? "Nenhuma mensagem ainda";

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={isActive ? "true" : undefined}
      className={`flex w-full flex-col gap-1.5 rounded-lg px-3 py-3 text-left transition-colors ${
        isActive ? "bg-teal-50 ring-1 ring-teal-600/20" : "hover:bg-slate-100"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-semibold text-slate-900">
          {conversation.customerName}
        </span>
        <span className="shrink-0 text-xs text-slate-500">
          {now !== null ? formatRelativeTime(lastActivity, now) : ""}
        </span>
      </div>
      <p className="truncate text-sm text-slate-600">{preview}</p>
      {conversation.category && (
        <div>
          <CategoryBadge category={conversation.category} />
        </div>
      )}
    </button>
  );
}
