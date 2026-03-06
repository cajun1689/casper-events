import { useState, useEffect, useMemo, useCallback } from "react";
import { addMonths, subMonths, format, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Sparkles, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import { eventsApi, categoriesApi } from "@/lib/api";
import { printCalendar } from "@/lib/print-calendar";
import type { EventWithDetails } from "@cyh/shared";
import { MonthView } from "@/components/MonthView";
import { WeekView } from "@/components/WeekView";
import { ListView } from "@/components/ListView";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ViewToggle } from "@/components/ViewToggle";
import { EventCardGrid } from "@/components/EventCardGrid";

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
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

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

  const handleEventClick = useCallback((eventId: string) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  }, []);

  function handleDateClick(date: Date) {
    setCurrentDate(date);
    setExpandedEventId(null);
  }

  function handleViewChange(mode: string) {
    const m = mode as "month" | "week" | "list";
    setViewMode(m);
    setExpandedEventId(null);
  }

  const handleToggleCategoryGroup = useCallback((slug: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }, []);

  const navLabel =
    viewMode === "week"
      ? `Week of ${format(currentDate, "MMM d, yyyy")}`
      : format(currentDate, "MMMM yyyy");

  const showCardGrid = viewMode !== "list";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-400 px-6 py-10 text-white shadow-xl shadow-primary-500/20 sm:px-10 sm:py-14">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-800/30 blur-3xl" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Casper, Wyoming
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Community Calendar
          </h1>
          <p className="max-w-xl text-base text-white/80">
            Discover events, activities, and things to do in our community. Filter by category, browse by date, or click any event to see details.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Controls row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={navigatePrev}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white/60 text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="min-w-[180px] text-center text-base font-bold text-gray-800">{navLabel}</h2>
            <button
              onClick={navigateNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white/60 text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => printCalendar({
                currentDate,
                events: filteredEvents,
                title: "Community Calendar",
                primaryColor: "#4f46e5",
              })}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/60 px-3 text-sm font-semibold text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow hover:text-gray-700"
              title="Print monthly calendar"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <ViewToggle current={viewMode} onChange={handleViewChange} />
          </div>
        </div>

        {/* Category filter */}
        <CategoryFilter
          categories={categories}
          selected={selectedCategories}
          onToggle={toggleCategory}
          onClear={clearCategoryFilter}
        />

        {/* Calendar content */}
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton h-12 w-full" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="skeleton h-24 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="animate-fade-in">
              {viewMode === "month" && (
                <MonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                  selectedEventId={expandedEventId}
                />
              )}
              {viewMode === "week" && (
                <WeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  selectedEventId={expandedEventId}
                />
              )}
              {viewMode === "list" && (
                <ListView events={filteredEvents} />
              )}
            </div>

            {/* Event cards below calendar */}
            {showCardGrid && filteredEvents.length > 0 && (
              <div className="mt-4">
                <EventCardGrid
                  events={filteredEvents}
                  categories={categories}
                  expandedEventId={expandedEventId}
                  onEventClick={handleEventClick}
                  collapsedCategories={collapsedCategories}
                  onToggleCategory={handleToggleCategoryGroup}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
