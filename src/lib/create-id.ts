// Gera um identificador único simples para conversas e mensagens criadas na tela.
// Não usa crypto.randomUUID porque ele só existe em páginas servidas por HTTPS ou localhost.
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}
