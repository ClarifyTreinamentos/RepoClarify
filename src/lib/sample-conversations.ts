import type { Conversation, Message, MessageAuthor } from "@/types/chat";

const MINUTE = 60 * 1000;

type SampleMessage = {
  author: MessageAuthor;
  text: string;
  // Há quantos minutos a mensagem foi enviada
  minutesAgo: number;
};

type SampleConversation = Omit<Conversation, "createdAt" | "messages"> & {
  messages: SampleMessage[];
};

// Conversas fictícias com pessoas da base de testes do TimeTrack (ver docs/timetrack-api.md, seção 7)
const SAMPLES: SampleConversation[] = [
  {
    id: "exemplo-1",
    customerName: "João Silva",
    customerEmail: "joao.silva@acme.com.br",
    title: "Conta bloqueada após tentativas de login",
    category: "acesso",
    messages: [
      {
        author: "user",
        text: "Oi, não consigo entrar no TimeTrack. Diz que minha conta está bloqueada.",
        minutesAgo: 12,
      },
      {
        author: "agent",
        text: "Olá, João! Vi que a conta foi bloqueada depois de 5 tentativas de senha incorreta. Quer que eu envie um email para redefinir a senha?",
        minutesAgo: 11,
      },
      {
        author: "user",
        text: "Sim, por favor. Pode mandar para joao.silva@acme.com.br",
        minutesAgo: 5,
      },
    ],
  },
  {
    id: "exemplo-2",
    customerName: "Maria Costa",
    customerEmail: "maria.costa@techcorp.com",
    title: "Horas do dia 12 não aparecem no relatório",
    category: "dados",
    messages: [
      {
        author: "user",
        text: "As marcações do dia 12 não aparecem no relatório mensal da equipe.",
        minutesAgo: 50,
      },
      {
        author: "agent",
        text: "Entendi, Maria. Vou registrar um chamado para a equipe verificar os dados desse dia.",
        minutesAgo: 40,
      },
    ],
  },
  {
    id: "exemplo-3",
    customerName: "Rafael Souza",
    customerEmail: "rafael.souza@logistica-sul.com.br",
    title: "Integração com a folha de pagamento",
    category: "integracao",
    messages: [
      {
        author: "user",
        text: "A exportação para o sistema de folha de pagamento está retornando erro desde ontem.",
        minutesAgo: 190,
      },
      {
        author: "agent",
        text: "Obrigado pelo aviso, Rafael. Você consegue me dizer qual mensagem de erro aparece?",
        minutesAgo: 180,
      },
    ],
  },
  {
    id: "exemplo-4",
    customerName: "Pedro Santos",
    customerEmail: "pedro@startup.io",
    title: "Não recebi o email de confirmação",
    category: "duvida",
    messages: [
      {
        author: "user",
        text: "Criei minha conta, mas não recebi o email de confirmação. O que eu faço?",
        minutesAgo: 60 * 26,
      },
      {
        author: "agent",
        text: "Oi, Pedro! Sua conta está pendente de confirmação. Confira a caixa de spam e me avise se não encontrar.",
        minutesAgo: 60 * 26 - 3,
      },
    ],
  },
  {
    id: "exemplo-5",
    customerName: "Carlos Mendes",
    customerEmail: "carlos.mendes@manufaturaltd.com.br",
    title: "Aplicativo fecha ao registrar ponto",
    category: "bug",
    messages: [
      {
        author: "user",
        text: "O aplicativo fecha sozinho quando toco em registrar ponto no celular.",
        minutesAgo: 60 * 50,
      },
      {
        author: "agent",
        text: "Sinto muito pelo transtorno, Carlos. Abri o chamado TT-2026-001523 para a equipe técnica.",
        minutesAgo: 60 * 49,
      },
    ],
  },
  {
    id: "exemplo-6",
    customerName: "Ana Ribeiro",
    customerEmail: "ana.ribeiro@pequenosnegocios.com.br",
    title: "Exportar relatório em Excel",
    category: "feature",
    messages: [
      {
        author: "user",
        text: "Seria ótimo poder exportar o relatório de horas direto para Excel.",
        minutesAgo: 60 * 24 * 4,
      },
      {
        author: "agent",
        text: "Boa ideia, Ana! Registrei sua sugestão para o time de produto avaliar.",
        minutesAgo: 60 * 24 * 4 - 10,
      },
    ],
  },
];

// Monta as conversas de exemplo com datas relativas a "agora", para parecerem sempre recentes
export function createSampleConversations(now: number): Conversation[] {
  return SAMPLES.map((sample) => {
    const messages: Message[] = sample.messages.map((message, index) => ({
      id: `${sample.id}-msg-${index + 1}`,
      author: message.author,
      text: message.text,
      sentAt: now - message.minutesAgo * MINUTE,
    }));

    return {
      ...sample,
      createdAt: messages[0]?.sentAt ?? now,
      messages,
    };
  });
}
