import type { Category } from "@/types/chat";

type CategoryStyle = {
  label: string;
  // Classes do Tailwind para fundo, texto e borda da etiqueta
  className: string;
};

// Rótulo exibido na tela e cor da etiqueta de cada categoria
export const CATEGORY_STYLES: Record<Category, CategoryStyle> = {
  acesso: {
    label: "Acesso",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  dados: {
    label: "Dados",
    className: "bg-sky-50 text-sky-700 ring-sky-600/20",
  },
  integracao: {
    label: "Integração",
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
  },
  duvida: {
    label: "Dúvida",
    className: "bg-slate-100 text-slate-700 ring-slate-500/20",
  },
  bug: {
    label: "Bug",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
  feature: {
    label: "Feature",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
};
