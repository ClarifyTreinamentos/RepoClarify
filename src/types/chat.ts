// Categorias aceitas pelo TimeTrack ao abrir um chamado (ver docs/timetrack-api.md)
export type Category =
  | "acesso"
  | "dados"
  | "integracao"
  | "duvida"
  | "bug"
  | "feature";

// "user" é a pessoa pedindo ajuda; "agent" é o atendente (o chatbot)
export type MessageAuthor = "user" | "agent";

export type Message = {
  id: string;
  author: MessageAuthor;
  text: string;
  // Data de envio em milissegundos (Date.now())
  sentAt: number;
  // Mensagem de falha do atendimento: aparece em balão avermelhado e não vai para a API
  isError?: boolean;
};

export type Conversation = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  title: string;
  // Conversas novas ainda não têm categoria definida
  category: Category | null;
  createdAt: number;
  messages: Message[];
};
