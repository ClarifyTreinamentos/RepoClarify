import { CATEGORY_STYLES } from "@/lib/categories";
import type { Category } from "@/types/chat";

type CategoryBadgeProps = {
  category: Category;
};

// Etiqueta colorida com o nome da categoria da conversa
export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { label, className } = CATEGORY_STYLES[category];

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
