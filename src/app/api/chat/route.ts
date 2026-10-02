import { origemChamados } from "@/lib/config";
import { instrucoesAtendente } from "@/lib/system-prompt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

function erro(mensagem: string, status = 200) {
  const linha = "data: " + JSON.stringify({ type: "error", message: mensagem }) + "\n\n";
  return new Response(linha, { status, headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" } });
}

async function repassar(messages: Msg[], textoSimples = false) {
  const origem = origemChamados();
  if (!origem) return erro("O atendimento ainda não foi configurado.", 500);
  let ultimas = messages.slice(-20);
  while (ultimas.length > 0 && ultimas[0].role !== "user") ultimas = ultimas.slice(1);
  if (ultimas.length === 0) return erro("Mande uma mensagem para começar.", 400);
  try {
    const r = await fetch(origem + "/api/cerebro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: ultimas, system: instrucoesAtendente }),
      signal: AbortSignal.timeout(55000),
      cache: "no-store",
    });
    if (!r.ok || !r.body) return erro("Não consegui falar com o atendimento agora. Tente de novo em instantes.", 502);
    const tipo = textoSimples ? "text/plain; charset=utf-8" : "text/event-stream; charset=utf-8";
    return new Response(r.body, { headers: { "Content-Type": tipo, "Cache-Control": "no-cache" } });
  } catch {
    return erro("Não consegui falar com o atendimento agora. Tente de novo em instantes.", 502);
  }
}

export async function POST(req: Request) {
  const corpo = await req.json().catch(() => null);
  if (!corpo || !Array.isArray(corpo.messages)) return erro("Não entendi a mensagem enviada.", 400);
  const valido = corpo.messages.every((m: Msg) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
  if (!valido) return erro("Não entendi a mensagem enviada.", 400);
  if (corpo.messages.some((m: Msg) => m.content.length > 4000)) return erro("Sua mensagem passou de 4000 caracteres. Resuma e envie de novo.", 400);
  return repassar(corpo.messages);
}

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("teste") === "1") {
    return repassar([{ role: "user", content: "Não consigo logar" }], true);
  }
  return erro("Use o chat para conversar.", 405);
}
