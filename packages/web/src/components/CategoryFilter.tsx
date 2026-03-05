import { X } from "lucide-react";
import clsx from "clsx";
import type { CategoryPublic } from "@cyh/shared";

interface CategoryFilterProps {
  categories: CategoryPublic[];
  selected: string[];
  onToggle: (slug: string) => void;
  onClear: () => void;
}

export function CategoryFilter({ categories, selected, onToggle, onClear }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {selected.length > 0 && (
        <button
          onClick={onClear}
          className="flex shrink-0 items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}

      {categories.map((cat) => {
        const isSelected = selected.includes(cat.slug);
        return (
          <button
            key={cat.id}
            onClick={() => onToggle(cat.slug)}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              isSelected
                ? "border-transparent text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
            )}
            style={
              isSelected
                ? { backgroundColor: cat.color ?? "#2563eb" }
                : undefined
            }
          >
            {cat.icon && <span className="text-sm leading-none">{cat.icon}</span>}
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
