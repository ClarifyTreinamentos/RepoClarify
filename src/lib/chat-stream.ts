// Cliente da rota /api/chat: envia o histórico e lê a resposta em streaming.
// A rota devolve linhas "data: {json}" com os tipos:
// - "text": pedaço da resposta do atendente (campo "text");
// - "done": fim da resposta;
// - "error": falha com mensagem amigável (campo "message").
// Outros tipos (como "tool") são ignorados.

export type ChatApiMessage = {
  role: "user" | "assistant";
  content: string;
};

type StreamHandlers = {
  onText: (text: string) => void;
  onError: (message: string) => void;
};

export const CONNECTION_ERROR_MESSAGE =
  "Não consegui falar com o atendimento agora. Tente de novo em instantes.";

const DATA_PREFIX = "data:";

// Resultado de cada linha lida: continuar lendo ou parar
type LineResult = "continue" | "stop";

export async function streamChatReply(
  messages: ChatApiMessage[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch {
    if (!signal?.aborted) handlers.onError(CONNECTION_ERROR_MESSAGE);
    return;
  }

  // O corpo é lido mesmo com status de erro (400, 500, 502): a rota manda
  // a mensagem amigável no mesmo formato "data: {...}".
  if (!response.body) {
    handlers.onError(CONNECTION_ERROR_MESSAGE);
    return;
  }

  let receivedAnything = false;
  const trackedHandlers: StreamHandlers = {
    onText: (text) => {
      receivedAnything = true;
      handlers.onText(text);
    },
    onError: (message) => {
      receivedAnything = true;
      handlers.onError(message);
    },
  };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? "\n" : decoder.decode(value, { stream: true });

      // Só processa linhas completas; o resto fica no buffer para o próximo pedaço
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let stopped = false;
      for (const line of lines) {
        if (handleLine(line, trackedHandlers) === "stop") {
          stopped = true;
          break;
        }
      }

      if (stopped || done) {
        if (stopped) await reader.cancel().catch(() => undefined);
        break;
      }
    }
  } catch {
    if (signal?.aborted) return;
    handlers.onError(CONNECTION_ERROR_MESSAGE);
    return;
  }

  // Resposta vazia ou fora do formato: nada chegou para mostrar
  if (!receivedAnything) handlers.onError(CONNECTION_ERROR_MESSAGE);
}

function handleLine(rawLine: string, handlers: StreamHandlers): LineResult {
  const line = rawLine.trim();
  if (!line.startsWith(DATA_PREFIX)) return "continue";

  const event = parseEvent(line.slice(DATA_PREFIX.length).trim());
  if (!event) return "continue";

  if (event.type === "text") {
    if (typeof event.text === "string") handlers.onText(event.text);
    return "continue";
  }
  if (event.type === "done") return "stop";
  if (event.type === "error") {
    const message =
      typeof event.message === "string" && event.message.trim()
        ? event.message
        : CONNECTION_ERROR_MESSAGE;
    handlers.onError(message);
    return "stop";
  }

  // Tipo desconhecido (por exemplo "tool"): ignora sem erro
  return "continue";
}

function parseEvent(json: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(json);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
