import type { Message } from "@/types/chat";

type MessageBubbleProps = {
  message: Message;
};

// Balão de mensagem: usuário à direita (cor principal), atendente à esquerda (fundo branco)
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.author === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[70%] ${
          isUser
            ? "rounded-br-sm bg-teal-600 text-white"
            : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
        }`}
      >
        <span className="sr-only">{isUser ? "Você: " : "Atendente: "}</span>
        {message.text}
      </div>
    </div>
  );
}
