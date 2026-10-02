// Rota do chat: repassa a conversa para o "cérebro" do bot, que fica no site de
// chamados (TIMETRACK_API_URL + "/api/cerebro"), e devolve a resposta em streaming
// (text/event-stream), pedaço por pedaço, do jeito que ela chegar.
// Roda só no servidor: o endereço do site de chamados nunca vai para o navegador.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

// Proteções de entrada
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

// Tempo máximo esperando o site de chamados começar a responder
const UPSTREAM_CONNECT_TIMEOUT_MS = 20_000;

// Não existe arquivo de instruções do atendente no repositório (system.md,
// atendente.md etc.), então o system prompt fica definido aqui.
const SYSTEM_PROMPT =
  "Você é o atendente de suporte do TimeTrack, um sistema de ponto eletrônico. Responda em português, com educação e frases curtas. Para problemas de acesso, peça o email. Nunca informe preços: ofereça um atendente humano. Recuse assuntos fora do TimeTrack.";

// Mensagem usada pelo GET /api/chat?teste=1
const TEST_MESSAGE = "Não consigo logar";

// Mensagens amigáveis exibidas ao usuário (nunca detalhes técnicos)
const FRIENDLY_ERRORS = {
  invalidRequest: "Não entendi o pedido enviado. Recarregue a página e tente de novo.",
  messageTooLong: `Sua mensagem passou do limite de ${MAX_MESSAGE_LENGTH} caracteres. Tente resumir um pouco.`,
  unavailable: "O atendimento está indisponível no momento. Tente novamente em alguns minutos.",
  upstreamFailed: "Não consegui falar com a central de atendimento agora. Tente novamente em instantes.",
  interrupted: "A resposta foi interrompida no meio do caminho. Envie sua mensagem de novo, por favor.",
} as const;

const SSE_CONTENT_TYPE = "text/event-stream; charset=utf-8";
const PLAIN_TEXT_CONTENT_TYPE = "text/plain; charset=utf-8";

const encoder = new TextEncoder();

/* ---------- Handlers ---------- */

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = parseMessages(body);

  if (!parsed.ok) {
    return errorResponse(parsed.message, 400, SSE_CONTENT_TYPE);
  }

  return forwardToBrain(parsed.messages, request.signal, SSE_CONTENT_TYPE);
}

// Atalho para testar pelo navegador: GET /api/chat?teste=1
export async function GET(request: Request): Promise<Response> {
  const isTest = new URL(request.url).searchParams.get("teste") === "1";

  if (!isTest) {
    return new Response("Use POST /api/chat ou GET /api/chat?teste=1.", {
      status: 405,
      headers: { "Content-Type": PLAIN_TEXT_CONTENT_TYPE, Allow: "GET, POST" },
    });
  }

  const messages: ChatMessage[] = [{ role: "user", content: TEST_MESSAGE }];
  return forwardToBrain(messages, request.signal, PLAIN_TEXT_CONTENT_TYPE);
}

/* ---------- Validação e recorte do histórico ---------- */

type ParseResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; message: string };

function parseMessages(body: unknown): ParseResult {
  if (!isRecord(body) || !Array.isArray(body.messages)) {
    return { ok: false, message: FRIENDLY_ERRORS.invalidRequest };
  }

  const rawMessages: unknown[] = body.messages;
  if (!rawMessages.every(isChatMessage)) {
    return { ok: false, message: FRIENDLY_ERRORS.invalidRequest };
  }

  const messages = trimHistory(rawMessages);
  if (messages.length === 0) {
    return { ok: false, message: FRIENDLY_ERRORS.invalidRequest };
  }

  // Só as mensagens que serão enviadas ao cérebro passam pelo limite de tamanho
  if (messages.some((message) => message.content.length > MAX_MESSAGE_LENGTH)) {
    return { ok: false, message: FRIENDLY_ERRORS.messageTooLong };
  }

  return { ok: true, messages };
}

// Mantém no máximo as últimas MAX_MESSAGES mensagens e garante que a
// primeira seja do usuário (o modelo exige começar por "user").
function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  const recent = messages.slice(-MAX_MESSAGES);
  const firstUserIndex = recent.findIndex((message) => message.role === "user");
  return firstUserIndex === -1 ? [] : recent.slice(firstUserIndex);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string"
  );
}

/* ---------- Chamada ao cérebro (site de chamados) ---------- */

async function forwardToBrain(
  messages: ChatMessage[],
  clientSignal: AbortSignal,
  contentType: string,
): Promise<Response> {
  const baseUrl = process.env.TIMETRACK_API_URL?.trim();
  if (!baseUrl) {
    console.error("[api/chat] TIMETRACK_API_URL não configurada");
    return errorResponse(FRIENDLY_ERRORS.unavailable, 500, contentType);
  }

  // Cancela a chamada se o usuário fechar a página ou se o site demorar demais
  // para começar a responder. O timeout é desligado assim que chegam os headers,
  // para não cortar uma resposta longa no meio.
  const controller = new AbortController();
  const abortUpstream = () => controller.abort();
  clientSignal.addEventListener("abort", abortUpstream, { once: true });
  const connectTimeout = setTimeout(abortUpstream, UPSTREAM_CONNECT_TIMEOUT_MS);

  try {
    const upstream = await fetch(buildBrainUrl(baseUrl), {
      method: "POST",
      headers: buildBrainHeaders(),
      body: JSON.stringify({ messages, system: SYSTEM_PROMPT }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      console.error(`[api/chat] cérebro respondeu com status ${upstream.status}`);
      return errorResponse(FRIENDLY_ERRORS.upstreamFailed, 502, contentType);
    }

    return new Response(relayStream(upstream.body), {
      status: 200,
      headers: streamHeaders(contentType),
    });
  } catch (error) {
    console.error("[api/chat] falha ao chamar o cérebro:", error);
    return errorResponse(FRIENDLY_ERRORS.upstreamFailed, 502, contentType);
  } finally {
    clearTimeout(connectTimeout);
  }
}

function buildBrainUrl(baseUrl: string): string {
  // Remove a barra final para não gerar "//api/cerebro"
  return `${baseUrl.replace(/\/+$/, "")}/api/cerebro`;
}

function buildBrainHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };

  // Identifica o aluno no painel do TimeTrack (ver docs/timetrack-api.md)
  const studentName = process.env.ALUNO_NOME;
  if (studentName) {
    headers["x-aluno"] = encodeURIComponent(studentName);
  }

  return headers;
}

/* ---------- Streaming ---------- */

// Repassa os bytes exatamente como chegam. Se a conexão cair no meio,
// fecha a resposta com um evento de erro amigável em vez de cortar em silêncio.
function relayStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  let endsWithNewline = true;
  let cancelled = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        if (value.length > 0) {
          endsWithNewline = value[value.length - 1] === 0x0a;
        }
        controller.enqueue(value);
      } catch (error) {
        // Se foi o próprio usuário que saiu, não há para quem avisar
        if (cancelled) return;
        console.error("[api/chat] streaming interrompido:", error);
        // Se o último pedaço parou no meio de uma linha, termina a linha antes
        const prefix = endsWithNewline ? "" : "\n";
        controller.enqueue(encoder.encode(prefix + sseError(FRIENDLY_ERRORS.interrupted)));
        controller.close();
      }
    },
    cancel(reason) {
      // O usuário fechou a conexão: cancela também a leitura do cérebro
      cancelled = true;
      return reader.cancel(reason);
    },
  });
}

function streamHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-cache, no-transform",
    // Evita que proxies segurem os pedaços até o fim da resposta
    "X-Accel-Buffering": "no",
  };
}

/* ---------- Erros ---------- */

function sseError(message: string): string {
  return `data: ${JSON.stringify({ type: "error", message })}\n\n`;
}

function errorResponse(message: string, status: number, contentType: string): Response {
  return new Response(sseError(message), {
    status,
    headers: streamHeaders(contentType),
  });
}
