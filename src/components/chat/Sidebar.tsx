import type { Conversation } from "@/types/chat";
import { ConversationListItem } from "./ConversationListItem";

type SidebarProps = {
  conversations: Conversation[];
  activeConversationId: string | null;
  now: number | null;
  // No celular a lista vira uma gaveta; no computador fica sempre visível
  isOpen: boolean;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
  onNewConversation: () => void;
};

// Coluna da esquerda: marca, botão de nova conversa e lista de conversas
export function Sidebar({
  conversations,
  activeConversationId,
  now,
  isOpen,
  onClose,
  onSelect,
  onNewConversation,
}: SidebarProps) {
  return (
    <>
      {/* Fundo escuro atrás da gaveta, só no celular */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="lista-conversas"
        className={`fixed inset-y-0 left-0 z-40 flex w-80 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:z-auto md:max-w-none md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Conversas"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
              TT
            </div>
            <span className="text-base font-semibold text-slate-900">
              TimeTrack Suporte
            </span>
          </div>
          <button
            type="button"
            onClick={onNewConversation}
            className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <span aria-hidden="true">+</span>
            Nova conversa
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <ConversationListItem
                  conversation={conversation}
                  isActive={conversation.id === activeConversationId}
                  now={now}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
