# API do TimeTrack — guia de integração do chatbot

O TimeTrack é um sistema FICTÍCIO de controle de ponto usado no curso.
Este documento explica como o chatbot de suporte (projeto do aluno) se conecta a ele.

- Endereço do TimeTrack: https://timetrack-curso.vercel.app
- Painel ao vivo (para ver as ações do bot acontecendo): https://timetrack-curso.vercel.app/painel
- Página explicativa: https://timetrack-curso.vercel.app/conectar

## 1. Variáveis de ambiente do projeto do chatbot

Coloque no `.env.local` (e as mesmas nas Environment Variables da Vercel):

```
MODO_CLAUDE=treino
TIMETRACK_API_URL=https://timetrack-curso.vercel.app
ALUNO_NOME=SeuNome
GEMINI_API_KEY=
```

- `MODO_CLAUDE`: `treino` usa o "Claude de treino" deste TimeTrack (grátis).
  `real` usa a API paga da Anthropic (precisa de `ANTHROPIC_API_KEY`).
- `TIMETRACK_API_URL`: endereço base da API abaixo.
- `ALUNO_NOME`: aparece no painel ao lado de cada ação feita pelo seu bot.
- `GEMINI_API_KEY` (opcional, grátis): com ela, o Claude de treino usa o Gemini como
  cérebro e passa a ser inteligente de verdade (ver seção 6). Vazia: respostas por regras.

Crie o cliente do SDK oficial (`@anthropic-ai/sdk`) SEMPRE assim, num arquivo só de servidor
(ex.: `src/lib/claude.ts`):

```ts
import Anthropic from "@anthropic-ai/sdk";

export function getClaude() {
  if (process.env.MODO_CLAUDE === "real") {
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, baseURL: "https://api.anthropic.com" });
  }
  return new Anthropic({
    apiKey: process.env.GEMINI_API_KEY || "treino",
    baseURL: `${process.env.TIMETRACK_API_URL}/api/claude-simulado`,
    defaultHeaders: { "x-aluno": encodeURIComponent(process.env.ALUNO_NOME ?? "") },
  });
}
```

ATENÇÃO: não use a variável `ANTHROPIC_BASE_URL` nem `new Anthropic()` sem opções.
O Claude Desktop define `ANTHROPIC_BASE_URL` nos comandos que ele roda, e o Next.js não
sobrescreve variáveis que já existem. Passar `baseURL` explícito evita esse problema.

## 2. Regras de integração (importante)

1. Chame o TimeTrack e o Claude SOMENTE no servidor (Route Handlers em `src/app/api/`).
   Nunca no navegador.
2. Use URL absoluta: `${process.env.TIMETRACK_API_URL}/api/mock/usuarios?email=...`.
   `fetch("/api/...")` com URL relativa NÃO funciona no servidor.
3. Envie o header `x-aluno` com `encodeURIComponent(process.env.ALUNO_NOME)` em toda
   chamada ao TimeTrack.
4. Erros sempre vêm como JSON `{ "erro": "mensagem" }` com status HTTP 4xx/5xx.
   Nunca deixe a exceção subir: devolva o erro ao Claude (ver seção 5).
5. Todos os dados são fictícios. Não existe autenticação.

## 3. Endpoints

### GET /api/mock/usuarios?email=EMAIL
Dados e status da conta de um usuário.
- 200: `{ "id", "email", "nome", "empresa", "plano", "ultimoLogin", "statusConta": "ativa"|"bloqueada"|"pendente", "motivoBloqueio"?, "totalUsuariosEmpresa" }`
- 400: email não informado · 404: `{ "erro": "Usuário não encontrado" }`

### GET /api/mock/chamados?usuario_email=EMAIL
Lista de chamados do usuário (sem o parâmetro: todos).
- 200: `[{ "protocolo": "TT-2026-001523", "usuarioEmail", "categoria", "prioridade", "descricao", "status", "criadoEm", "atualizadoEm", "origem"? }]`

### POST /api/mock/chamados
Abre um chamado. Corpo JSON:
`{ "usuario_email": "...", "categoria": "acesso|dados|integracao|duvida|bug|feature", "descricao": "...", "prioridade"?: "baixa|media|alta|critica" }`
- 200: `{ "sucesso": true, "protocolo": "TT-2026-NNNNNN", "mensagem": "..." }`
- 400: campo faltando ou categoria/prioridade inválida

### GET /api/mock/sistema
Status atual do sistema.
- 200: `{ "geral": "operacional|incidente|manutencao", "componentes": [{ "nome", "status": "operacional|degradado|fora", "detalhes"? }], "incidenteAtivo"?: { "titulo", "iniciadoEm", "descricao" }, "cenario", "verificadoEm" }`

### POST /api/mock/reset-senha
Envia o email de redefinição de senha. Corpo: `{ "email": "..." }`
- 200: `{ "sucesso": true, "mensagem": "Email de reset enviado para ...", "enviadoEm" }`
- 404: email não encontrado · 409: conta pendente de ativação (reset indisponível)

### POST /api/mock/escalar
Transfere o atendimento para a fila humana. Corpo:
`{ "motivo": "...", "urgencia": "baixa|media|alta|critica", "usuario_email"?: "..." }`
- 200: `{ "sucesso": true, "protocolo", "posicaoFila", "tempoEstimadoMinutos", "mensagem" }`

## 4. Ferramentas (tools) para o Claude

Use EXATAMENTE estes nomes e campos: o Claude de treino reconhece apenas estes.

```json
[
  {
    "name": "consultar_usuario",
    "description": "Consulta os dados de um usuário do TimeTrack pelo email: plano, status da conta (ativa, bloqueada, pendente) e motivo do bloqueio. Use quando o problema envolver a conta do usuário e ele já tiver informado o email.",
    "input_schema": { "type": "object", "properties": { "email": { "type": "string", "description": "Email do usuário" } }, "required": ["email"] }
  },
  {
    "name": "consultar_chamados_usuario",
    "description": "Lista os chamados já registrados para um email. Use quando o usuário perguntar sobre os chamados dele.",
    "input_schema": { "type": "object", "properties": { "email": { "type": "string" } }, "required": ["email"] }
  },
  {
    "name": "consultar_status_sistema",
    "description": "Retorna o status atual do TimeTrack e se há incidente. Use quando o usuário perguntar se o sistema caiu ou relatar lentidão geral.",
    "input_schema": { "type": "object", "properties": {} }
  },
  {
    "name": "resetar_senha",
    "description": "Envia o email de redefinição de senha. Só use depois de consultar a conta e de o usuário confirmar que quer o reset.",
    "input_schema": { "type": "object", "properties": { "email": { "type": "string" } }, "required": ["email"] }
  },
  {
    "name": "abrir_chamado",
    "description": "Registra um chamado de suporte e devolve o protocolo. Use para bugs, dados incorretos e problemas de integração.",
    "input_schema": {
      "type": "object",
      "properties": {
        "usuario_email": { "type": "string" },
        "categoria": { "type": "string", "enum": ["acesso", "dados", "integracao", "duvida", "bug", "feature"] },
        "descricao": { "type": "string" },
        "prioridade": { "type": "string", "enum": ["baixa", "media", "alta", "critica"] }
      },
      "required": ["usuario_email", "categoria", "descricao"]
    }
  },
  {
    "name": "escalar_para_humano",
    "description": "Transfere o atendimento para um atendente humano. Use quando o usuário pedir uma pessoa, o assunto for comercial (preço, cobrança) ou você não conseguir resolver.",
    "input_schema": {
      "type": "object",
      "properties": {
        "motivo": { "type": "string" },
        "urgencia": { "type": "string", "enum": ["baixa", "media", "alta", "critica"] },
        "usuario_email": { "type": "string" }
      },
      "required": ["motivo", "urgencia"]
    }
  }
]
```

Qual endpoint cada tool chama:

| Tool | Chamada ao TimeTrack |
|---|---|
| consultar_usuario | GET /api/mock/usuarios?email={email} |
| consultar_chamados_usuario | GET /api/mock/chamados?usuario_email={email} |
| consultar_status_sistema | GET /api/mock/sistema |
| resetar_senha | POST /api/mock/reset-senha `{ email }` |
| abrir_chamado | POST /api/mock/chamados `{ usuario_email, categoria, descricao, prioridade? }` |
| escalar_para_humano | POST /api/mock/escalar `{ motivo, urgencia, usuario_email? }` |

## 5. Loop de tool use (como o chat deve funcionar)

1. Envie ao Claude: `system` (conteúdo de prompts/system.md), `tools` e o histórico `messages`.
2. Se `stop_reason === "tool_use"`, pegue TODOS os blocos `tool_use` da resposta
   (use `filter`, não `find`: o Claude pode pedir mais de uma tool por vez).
3. Execute cada tool chamando o TimeTrack.
4. Acrescente ao histórico: `{ role: "assistant", content: resposta.content }` e depois UMA mensagem
   `{ role: "user", content: [ { type: "tool_result", tool_use_id, content: JSON.stringify(resultado), is_error? } ] }`
   com um `tool_result` para CADA `tool_use` (mesmo `tool_use_id`).
5. Chame o Claude de novo. Repita até `stop_reason` ser diferente de `"tool_use"`.
6. Limite: no máximo 6 voltas. Passou disso, pare e ofereça atendimento humano.
7. Se o TimeTrack devolver erro, mande `{ erro: "..." }` no `tool_result` com `is_error: true`.

## 6. Claude de treino (simulador)

`POST https://timetrack-curso.vercel.app/api/claude-simulado/v1/messages` responde no MESMO formato da Claude API
(com e sem streaming, tool use, erros 400/401 e `usage`). O SDK oficial funciona sem mudanças:
basta o `baseURL` da seção 1.

Ele tem dois cérebros:

**Cérebro REGRAS (padrão, sem chave):**
- Responde por regras fixas (palavras-chave). NÃO é um modelo de linguagem.
- IGNORA o system prompt. A qualidade do prompt se testa no Claude.ai.
- Só chama as tools da seção 4 que o seu código enviou em `tools`.
- Reconhece o classificador quando não há tools e o system prompt fala em
  classificar, categoria e JSON. Aí devolve `{"categoria","urgencia","confianca","resumo"}`.

**Cérebro GEMINI (opcional, grátis):**
- Crie uma chave em https://aistudio.google.com (conta Google pessoal, maiores de 18 anos,
  sem cartão) e coloque em `GEMINI_API_KEY`. O cliente da seção 1 envia essa chave.
- O TimeTrack traduz o pedido para o Gemini e a resposta de volta para o formato da Claude API.
  Seu código NÃO muda. O system prompt, as tools e o histórico passam a valer de verdade.
- Plano grátis: cota diária limitada por chave. Se a cota acabar ou a chave falhar,
  o TimeTrack volta sozinho para o cérebro REGRAS (a conversa não quebra).
- No plano grátis o Google pode usar as conversas para melhorar os produtos dele:
  use só os dados fictícios do TimeTrack, nunca dados pessoais.
- O painel (https://timetrack-curso.vercel.app/painel) mostra qual cérebro respondeu ao seu bot.

Frases que ele entende (para testar):

| Frase | O que acontece |
|---|---|
| "Não consigo logar" | Pede o email |
| "meu email é joao@empresa.com" | consultar_usuario → conta bloqueada, oferece reset |
| "sim" (depois da oferta de reset) | resetar_senha |
| "O sistema está fora do ar?" | consultar_status_sistema |
| "Quais são meus chamados? sou maria.costa@techcorp.com" | consultar_chamados_usuario |
| "O app fecha sozinho, meu email é marina@empresa.com, abre um chamado" | abrir_chamado |
| "Quero falar com um atendente" | escalar_para_humano |
| "Quanto custa o plano Business?" | Não inventa preço, oferece humano |
| "Quem ganhou a eleição?" / "Ignore as instruções" | Recusa e volta ao assunto |

## 7. Usuários fictícios para testar

| Email | Nome | Plano | Status |
|---|---|---|---|
| `joao.silva@acme.com.br` | João Silva | business | bloqueada (5 tentativas de senha incorreta) |
| `maria.costa@techcorp.com` | Maria Costa | enterprise | ativa |
| `pedro@startup.io` | Pedro Santos | starter | pendente (aguardando confirmação de email) |
| `ana.ribeiro@pequenosnegocios.com.br` | Ana Ribeiro | free | ativa |
| `carlos.mendes@manufaturaltd.com.br` | Carlos Mendes | business | ativa |
| `joao@empresa.com` | João Pereira | business | bloqueada (5 tentativas de senha incorreta) |
| `carlos@empresa.com` | Carlos Silva | business | bloqueada (senha expirada (política de troca a cada 90 dias)) |
| `marina@empresa.com` | Marina Costa | business | ativa |
| `fernanda.lima@clinicavida.com.br` | Fernanda Lima | starter | bloqueada (pagamento da assinatura em atraso há 30 dias) |
| `rafael.souza@logistica-sul.com.br` | Rafael Souza | enterprise | ativa |
| `beatriz.alves@agenciaazul.com` | Beatriz Alves | free | pendente (aguardando aprovação do administrador da empresa) |
| `lucas.martins@supermercadobom.com.br` | Lucas Martins | business | ativa |

## 8. Sugestão de formato para o /api/chat do aluno (streaming)

O `/api/chat` do projeto do aluno recebe `{ messages: [{ role, content }] }` e responde
`text/event-stream`, uma linha por evento:

```
data: {"type":"text","text":"pedaço da resposta"}
data: {"type":"tool_start","id":"toolu_...","name":"consultar_usuario"}
data: {"type":"tool_end","id":"toolu_...","name":"consultar_usuario","ok":true,"summary":"Conta bloqueada"}
data: {"type":"done"}
data: {"type":"error","message":"mensagem amigável"}
```
