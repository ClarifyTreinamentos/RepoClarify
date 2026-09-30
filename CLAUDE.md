# CLAUDE.md

## Sobre o projeto

Chatbot de suporte do TimeTrack, um sistema fictício de controle de ponto. Projeto feito no curso Desenvolvimento Web com Claude.

## Stack

- Next.js 15 com App Router (código em `src/app/`)
- TypeScript estrito (`"strict": true` no `tsconfig.json`). Nunca use `any`; prefira tipos explícitos, `unknown` com validação ou generics.
- Tailwind CSS puro. Não instale bibliotecas de componentes (shadcn/ui, MUI, Chakra, DaisyUI etc.).

## Idiomas

- Textos exibidos na tela: português do Brasil.
- Código (nomes de variáveis, funções, tipos, arquivos): inglês.
- Comentários no código: português.

## TimeTrack (sistema externo)

O TimeTrack é um sistema EXTERNO, documentado em `docs/timetrack-api.md`.
Sempre leia esse arquivo antes de programar qualquer coisa ligada ao TimeTrack ou ao Claude (endpoints, tools, loop de tool use, cliente do SDK, variáveis de ambiente).

## Regras

- Nunca coloque chaves, senhas ou tokens no código. Use variáveis de ambiente (`.env.local`, que não vai para o Git) e documente os nomes necessários sem os valores.
- O repositório é público: escreva o código pensando que outras pessoas vão ler e complementar o sistema. Nomes claros, funções pequenas, estrutura previsível e comentários onde a intenção não for óbvia.
- Nunca use emojis nem travessões (— ou –) nos textos do frontend.

## Commits

Sempre que for fazer um commit, use a Skill `.claude/skills/clarify-commits/SKILL.md`. Ela traz o padrão completo; em resumo:

- Mensagens em português do Brasil.
- Título no formato `tipo(escopo opcional): descrição`.
- Autor de todo commit: Matheus Macedo (`git commit --author="Matheus Macedo <ia@clarify.com.br>"`), para o nome aparecer no topo do commit.
- Tipos permitidos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`.
- Descrição em minúsculas, sem ponto final, com até 72 caracteres.
- A mensagem termina com uma única frase dizendo o principal ganho: `Ganho: <frase>.` (trailers do Git, como `Co-Authored-By`, ficam abaixo dela).

Exemplos bons de título:

- `feat(chat): adiciona gaveta de conversas no celular`
- `fix(api): trata erro 404 ao consultar usuário no TimeTrack`
- `docs: adiciona guia de integração da API do TimeTrack`

## Comandos

```bash
npm run dev    # desenvolvimento em http://localhost:3000
npm run build  # build de produção (rode antes de dar commit)
npm start      # serve o build de produção
```
