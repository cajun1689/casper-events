import { useState, useEffect, useMemo } from "react";
import { addMonths, subMonths, format, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { eventsApi, categoriesApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";
import { MonthView } from "@/components/MonthView";
import { WeekView } from "@/components/WeekView";
import { ListView } from "@/components/ListView";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ViewToggle } from "@/components/ViewToggle";

export default function HomePage() {
  const {
    categories,
    selectedCategories,
    viewMode,
    setCategories,
    setViewMode,
    toggleCategory,
    clearCategoryFilter,
  } = useStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [listDateFilter, setListDateFilter] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [eventsRes, catsRes] = await Promise.all([
          eventsApi.list(),
          categoriesApi.list(),
        ]);
        setEvents(eventsRes.data);
        setCategories(catsRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setCategories]);

  const filteredEvents = useMemo(() => {
    if (selectedCategories.length === 0) return events;
    return events.filter((e) =>
      e.categories.some((c) => selectedCategories.includes(c.slug))
    );
  }, [events, selectedCategories]);

  function navigatePrev() {
    if (viewMode === "week") {
      setCurrentDate((d) => subWeeks(d, 1));
    } else {
      setCurrentDate((d) => subMonths(d, 1));
    }
  }

  function navigateNext() {
    if (viewMode === "week") {
      setCurrentDate((d) => addWeeks(d, 1));
    } else {
      setCurrentDate((d) => addMonths(d, 1));
    }
  }

  function handleDateClick(date: Date) {
    setListDateFilter(date);
    setViewMode("list");
    setCurrentDate(date);
  }

  function handleViewChange(mode: string) {
    const m = mode as "month" | "week" | "list";
    setViewMode(m);
    if (m !== "list") setListDateFilter(null);
  }

  const navLabel =
    viewMode === "week"
      ? `Week of ${format(currentDate, "MMM d, yyyy")}`
      : format(currentDate, "MMMM yyyy");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Community Calendar
          </h1>
          <ViewToggle current={viewMode} onChange={handleViewChange} />
        </div>

        {/* Category filter */}
        <CategoryFilter
            categories={categories}
            selected={selectedCategories}
            onToggle={toggleCategory}
            onClear={clearCategoryFilter}
          />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={navigatePrev}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <h2 className="text-lg font-semibold text-gray-800">{navLabel}</h2>

          <button
            onClick={navigateNext}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            className={clsx(
              "bg-white rounded-xl shadow-sm border border-gray-200",
              viewMode === "list" && "divide-y divide-gray-100"
            )}
          >
            {viewMode === "month" && (
              <MonthView
                currentDate={currentDate}
                events={filteredEvents}
                onDateClick={handleDateClick}
              />
            )}
            {viewMode === "week" && (
              <WeekView currentDate={currentDate} events={filteredEvents} />
            )}
            {viewMode === "list" && (
              <ListView events={filteredEvents} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
