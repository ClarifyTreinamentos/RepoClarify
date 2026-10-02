import { siteChamados, origemChamados } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Leitura = { textos: number; fim: boolean; erro: string; invalidas: number; esgotou: boolean; cerebro: string };

async function lerStream(r: Response, limiteMs: number): Promise<Leitura> {
  const out: Leitura = { textos: 0, fim: false, erro: "", invalidas: 0, esgotou: false, cerebro: "" };
  if (!r.body) return out;
  const leitor = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const prazo = Date.now() + limiteMs;
  while (true) {
    const restante = prazo - Date.now();
    if (restante <= 0) { out.esgotou = true; break; }
    const passo = await Promise.race([
      leitor.read(),
      new Promise<"esgotou">((ok) => setTimeout(() => ok("esgotou"), restante)),
    ]);
    if (passo === "esgotou") { out.esgotou = true; break; }
    if (passo.done) buf += "\n";
    else buf += dec.decode(passo.value, { stream: true });
    const linhas = buf.split("\n");
    buf = linhas.pop() || "";
    for (const linha of linhas) {
      const l = linha.trim();
      if (!l) continue;
      if (!l.startsWith("data:")) { out.invalidas++; continue; }
      try {
        const j = JSON.parse(l.slice(5).trim());
        if (j.type === "text") out.textos++;
        else if (j.type === "done") { out.fim = true; out.cerebro = String(j.cerebro || ""); }
        else if (j.type === "error") out.erro = String(j.message || "erro sem mensagem");
      } catch { out.invalidas++; }
    }
    if (out.fim || out.erro || passo.done) break;
  }
  try { await leitor.cancel(); } catch {}
  return out;
}

function saida(codigo: string, titulo: string, linhas: string[]) {
  const corpo = ["CÓDIGO " + codigo + " · " + titulo, "", ...linhas].join("\n");
  return new Response(corpo, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const meuSite = proto + "://" + host;
  const origem = origemChamados();
  const info = ["Chatbot: " + meuSite, "Site de chamados escrito na configuração: " + siteChamados];

  if (!origem) return saida("D2", "LINK DO SITE DE CHAMADOS NÃO CONFIGURADO", info);
  info.push("Endereço usado: " + origem);
  if (new URL(origem).host === host) return saida("D5", "O LINK APONTA PARA O PRÓPRIO CHATBOT", info);

  const conversa = { messages: [{ role: "user", content: "Não consigo logar" }], system: "Teste do diagnóstico." };
  let resp: Response;
  try {
    resp = await fetch(origem + "/api/cerebro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(conversa),
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });
  } catch {
    return saida("D3", "SITE DE CHAMADOS NÃO RESPONDE", info);
  }
  const tipo = resp.headers.get("content-type") || "";
  info.push("Resposta do cérebro: status " + resp.status + ", tipo " + (tipo || "vazio"));
  if (resp.status === 404 || resp.status === 405 || tipo.includes("text/html")) {
    return saida("D4", "SITE DE CHAMADOS SEM CÉREBRO", info);
  }
  const t = await lerStream(resp, 25000);
  if (t.erro) return saida("D6", "CÉREBRO RESPONDEU COM ERRO", [...info, "Mensagem do cérebro: " + t.erro]);
  if (t.invalidas > 0 || (!t.esgotou && !t.fim)) {
    return saida("D6", "CÉREBRO RESPONDEU FORA DO FORMATO", [...info, "Pedaços certos: " + t.textos + ". Linhas fora do formato: " + t.invalidas + "."]);
  }
  if (t.textos === 0 || !t.fim) return saida("D7", "CÉREBRO NÃO TERMINOU A RESPOSTA", [...info, "Pedaços recebidos em 25 segundos: " + t.textos]);
  info.push("Cérebro usado: " + (t.cerebro || "não informado"));

  let c: Leitura;
  try {
    const r2 = await fetch(meuSite + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Não consigo logar" }] }),
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });
    info.push("Resposta da rota do chat: status " + r2.status);
    c = await lerStream(r2, 25000);
  } catch {
    return saida("D8", "A ROTA DO CHAT NÃO RESPONDE", info);
  }
  if (c.erro) return saida("D8", "A ROTA DO CHAT NÃO RESPONDE", [...info, "Mensagem: " + c.erro]);
  if (c.textos === 0 || !c.fim) return saida("D8", "A ROTA DO CHAT NÃO RESPONDE", [...info, "Pedaços recebidos: " + c.textos]);

  return saida("D0", "TUDO CERTO NO SERVIDOR", [...info, "", "Próximo passo: abra a tela do chat e mande: Não consigo logar"]);
}
