// Endereço do site de chamados (TimeTrack) deste aluno.
export const siteChamados = "https://sistema-de-chamados-eight-blush.vercel.app";

// Devolve só a origem (https://dominio), ignorando caminho, barra ou parâmetros.
export function origemChamados(): string | null {
  try {
    const u = new URL(siteChamados.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}
