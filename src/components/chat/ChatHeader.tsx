import type { Conversation } from "@/types/chat";
import { CategoryBadge } from "./CategoryBadge";

type ChatHeaderProps = {
  conversation: Conversation | null;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
};

// Topo da conversa aberta: botão de menu (só no celular), título e categoria
export function ChatHeader({
  conversation,
  isSidebarOpen,
  onOpenSidebar,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="Abrir lista de conversas"
        aria-controls="lista-conversas"
        aria-expanded={isSidebarOpen}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="truncate text-base font-semibold text-slate-900">
          {conversation?.title ?? "TimeTrack Suporte"}
        </h1>
        {conversation?.category && (
          <CategoryBadge category={conversation.category} />
        )}
      </div>
    </header>
  );
}
