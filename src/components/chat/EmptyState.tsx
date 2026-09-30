// Frases sugeridas para começar uma conversa
const SUGGESTIONS = [
  "Não consigo logar no TimeTrack, meu email é joao@empresa.com",
  "Preciso de um relatório de horas do mês passado",
  "O sistema está fora do ar?",
  "Você sabe quem ganhou a eleição?",
];

type EmptyStateProps = {
  disabled: boolean;
  onSuggestionClick: (text: string) => void;
};

// Tela da conversa vazia: pergunta inicial e botões de sugestão
export function EmptyState({ disabled, onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
      <h2 className="text-2xl font-semibold text-slate-900">
        Como posso ajudar?
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Escolha uma sugestão ou escreva sua mensagem abaixo.
      </p>

      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestionClick(suggestion)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition-colors hover:border-teal-600/40 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
