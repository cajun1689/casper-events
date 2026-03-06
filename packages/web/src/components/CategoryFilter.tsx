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
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {selected.length > 0 && (
        <button
          onClick={onClear}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/60 px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-gray-700 hover:shadow"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}

      {categories.map((cat) => {
        const isSelected = selected.includes(cat.slug);
        return (
          <button
            key={cat.id}
            onClick={() => onToggle(cat.slug)}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
              isSelected
                ? "border-transparent text-white shadow-md -translate-y-px"
                : "border-gray-200/80 bg-white/60 text-gray-600 shadow-sm backdrop-blur-sm hover:bg-white hover:shadow hover:-translate-y-px",
            )}
            style={
              isSelected
                ? {
                    backgroundColor: cat.color ?? "#4f46e5",
                    boxShadow: `0 4px 14px -3px ${cat.color ?? "#4f46e5"}50`,
                  }
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
