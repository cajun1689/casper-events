import { Calendar, CalendarDays, List } from "lucide-react";
import clsx from "clsx";

interface ViewToggleProps {
  current: string;
  onChange: (mode: string) => void;
}

const views = [
  { key: "month", label: "Month", icon: Calendar },
  { key: "week", label: "Week", icon: CalendarDays },
  { key: "list", label: "List", icon: List },
] as const;

export function ViewToggle({ current, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
      {views.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            current === key
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
