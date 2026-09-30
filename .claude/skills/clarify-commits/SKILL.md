---
name: clarify-commits
description: Padrão de mensagens de commit deste projeto (português do Brasil, formato tipo(escopo): descrição, autor Matheus Macedo e frase de ganho no final). Use SEMPRE que for criar um commit neste repositório, inclusive commits pedidos de forma indireta ("salva isso", "manda pro GitHub", "faz o merge").
---

# Padrão de commits do projeto

Siga todas as regras abaixo em todo commit deste repositório.

## 1. Autor: Matheus Macedo

Todo commit é feito com o autor **Matheus Macedo**, para que o nome apareça no topo do commit no GitHub e no `git log`. Passe o autor no próprio comando:

```bash
git commit --author="Matheus Macedo <ia@clarify.com.br>" -F mensagem.txt
```

## 2. Idioma

A mensagem inteira é escrita em português do Brasil.

## 3. Título: `tipo(escopo opcional): descrição`

A primeira linha segue o formato `tipo(escopo): descrição`. O escopo é opcional e indica a parte do projeto afetada (ex.: `chat`, `api`, `timetrack`, `skills`). Sem escopo, fica `tipo: descrição`.

Tipos permitidos (use apenas estes):

| Tipo | Quando usar |
|---|---|
| `feat` | nova funcionalidade para quem usa o sistema |
| `fix` | correção de erro |
| `refactor` | mudança no código que não altera o comportamento |
| `docs` | documentação (README, CLAUDE.md, docs/, skills) |
| `test` | criação ou ajuste de testes |
| `chore` | configuração, dependências, scripts e manutenção |
| `style` | formatação e estilo visual do código, sem mudar a lógica |

Regras da descrição:

- em letras minúsculas (nomes próprios e nomes de código, como TimeTrack ou ChatApp, mantêm a grafia original);
- sem ponto final;
- no máximo 72 caracteres;
- verbo no presente, dizendo o que o commit faz (ex.: "adiciona", "corrige", "remove").

## 4. Corpo (opcional)

Depois de uma linha em branco, explique o que mudou e por quê, se o título não bastar.

## 5. Frase de ganho no final

A mensagem termina com **uma única frase** dizendo o principal ganho da mudança, no formato `Ganho: <frase>.`

Se alguma ferramenta acrescentar trailers do Git (como `Co-Authored-By:`), eles ficam abaixo da frase de ganho, porque o Git só os reconhece quando estão no fim da mensagem.

## Exemplos bons

```
feat(chat): adiciona gaveta de conversas no celular

Ganho: quem usa o celular passa a navegar entre as conversas sem perder espaço de leitura.
```

```
fix(api): trata erro 404 ao consultar usuário no TimeTrack

Quando o email não existia, a rota quebrava e o chat mostrava uma tela em branco.
Agora o erro volta para o Claude como tool_result com is_error.

Ganho: o atendente responde que o usuário não foi encontrado em vez de travar a conversa.
```

```
docs: adiciona guia de integração da API do TimeTrack

Ganho: qualquer pessoa que abrir o repositório encontra endpoints e tools em um só lugar.
```

## Exemplos ruins (não faça)

- `Adicionei a tela.` (sem tipo, com maiúscula e ponto final)
- `feat: Add chat screen` (em inglês e com maiúscula)
- `update(chat): ajustes` (tipo fora da lista e descrição vaga)

## Checklist antes de commitar

1. Autor é Matheus Macedo.
2. Mensagem em português do Brasil.
3. Título no formato `tipo(escopo): descrição`, com tipo da lista.
4. Descrição em minúsculas, sem ponto final, até 72 caracteres.
5. Última frase da mensagem é `Ganho: ...` (antes de eventuais trailers).
