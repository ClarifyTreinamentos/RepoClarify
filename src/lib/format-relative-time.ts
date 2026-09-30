const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Converte uma data em texto curto relativo a "agora", ex.: "há 5 min", "ontem", "há 3 dias"
export function formatRelativeTime(timestamp: number, now: number): string {
  const elapsed = Math.max(0, now - timestamp);

  if (elapsed < MINUTE) return "agora";
  if (elapsed < HOUR) return `há ${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `há ${Math.floor(elapsed / HOUR)} h`;

  const days = Math.floor(elapsed / DAY);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;

  return new Date(timestamp).toLocaleDateString("pt-BR");
}
