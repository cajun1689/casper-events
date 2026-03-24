import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { addMonths, subMonths, format, addWeeks, subWeeks, startOfDay, endOfDay, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Sparkles, Printer, Search, MapPin, Building2, X } from "lucide-react";
import { useStore, type DatePreset } from "@/lib/store";
import { eventsApi, categoriesApi, organizationsApi } from "@/lib/api";

function getDateRangeForPreset(preset: DatePreset): { startAfter: string; startBefore: string } | null {
  const now = new Date();
  if (preset === "all") return null;
  if (preset === "today") {
    return {
      startAfter: startOfDay(now).toISOString(),
      startBefore: endOfDay(now).toISOString(),
    };
  }
  if (preset === "tomorrow") {
    const t = addDays(now, 1);
    return {
      startAfter: startOfDay(t).toISOString(),
      startBefore: endOfDay(t).toISOString(),
    };
  }
  if (preset === "weekend") {
    const day = now.getDay(); // 0=Sun, 6=Sat
    let start: Date;
    let end: Date;
    if (day === 0) {
      start = startOfDay(now);
      end = endOfDay(now);
    } else if (day === 6) {
      start = startOfDay(now);
      end = endOfDay(addDays(now, 1));
    } else {
      const daysUntilSat = 6 - day;
      start = startOfDay(addDays(now, daysUntilSat));
      end = endOfDay(addDays(now, daysUntilSat + 1));
    }
    return {
      startAfter: start.toISOString(),
      startBefore: end.toISOString(),
    };
  }
  if (preset === "next7") {
    return {
      startAfter: startOfDay(now).toISOString(),
      startBefore: endOfDay(addDays(now, 7)).toISOString(),
    };
  }
  return null;
}

function getViewDateRange(viewMode: string, currentDate: Date): { startAfter: string; startBefore: string } {
  if (viewMode === "week") {
    return {
      startAfter: startOfWeek(currentDate, { weekStartsOn: 0 }).toISOString(),
      startBefore: endOfWeek(currentDate, { weekStartsOn: 0 }).toISOString(),
    };
  }
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  return {
    startAfter: startOfWeek(monthStart, { weekStartsOn: 0 }).toISOString(),
    startBefore: endOfWeek(monthEnd, { weekStartsOn: 0 }).toISOString(),
  };
}

import { printCalendar } from "@/lib/print-calendar";
import type { EventWithDetails } from "@cyh/shared";
import { MonthView } from "@/components/MonthView";
import { WeekView } from "@/components/WeekView";
import { ListView } from "@/components/ListView";
import { PosterView } from "@/components/PosterView";
import { MapView } from "@/components/MapView";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ViewToggle } from "@/components/ViewToggle";
import { EventCardGrid } from "@/components/EventCardGrid";
import { DigestSignup } from "@/components/DigestSignup";
import { SiteSponsors } from "@/components/SiteSponsors";

const WYOMING_CITIES = [
  "All Wyoming", "Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs",
  "Sheridan", "Green River", "Evanston", "Riverton", "Cody", "Douglas",
  "Powell", "Rawlins", "Worland", "Torrington", "Jackson", "Buffalo",
  "Lander", "Wheatland", "Kemmerer", "Newcastle", "Thermopolis", "Sundance",
  "Glenrock", "Lovell", "Saratoga", "Pinedale", "Afton",
];

function OrgFilterDropdown({
  organizations,
  selectedCity,
  selectedOrgIds,
  onToggle,
  onClear,
}: {
  organizations: import("@cyh/shared").OrganizationPublic[];
  selectedCity: string;
  selectedOrgIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  const visibleOrgs = useMemo(() => {
    if (selectedCity === "All Wyoming") return organizations;
    return organizations.filter(
      (org) => org.address?.toLowerCase().includes(selectedCity.toLowerCase())
    );
  }, [organizations, selectedCity]);

  const count = selectedOrgIds.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition-all ${
          count > 0
            ? "border-primary-300 bg-primary-50 text-primary-700"
            : "border-gray-200/80 bg-white/60 text-gray-600 hover:bg-white hover:text-gray-800"
        }`}
      >
        <Building2 className="h-4 w-4" />
        {count > 0 ? `${count} org${count > 1 ? "s" : ""} selected` : "All organizations"}
        {count > 0 && (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-200 text-primary-700 hover:bg-primary-300"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-2 max-h-72 w-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
            {visibleOrgs.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">No organizations in this city</p>
            ) : (
              visibleOrgs.map((org) => {
                const active = selectedOrgIds.includes(org.id);
                return (
                  <button
                    key={org.id}
                    onClick={() => onToggle(org.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                      active ? "border-primary-500 bg-primary-500 text-white" : "border-gray-300"
                    }`}>
                      {active && (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{org.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const {
    categories,
    selectedCategories,
    viewMode,
    datePreset,
    selectedCity,
    selectedOrgIds,
    organizations,
    setCategories,
    setViewMode,
    setDatePreset,
    setSelectedCity,
    setOrganizations,
    toggleCategory,
    clearCategoryFilter,
    toggleOrgFilter,
    clearOrgFilter,
  } = useStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    async function load() {
      try {
        const presetRange = getDateRangeForPreset(datePreset);

        let params: Record<string, string> = { limit: "100" };
        if (presetRange) {
          params.startAfter = presetRange.startAfter;
          params.startBefore = presetRange.startBefore;
        } else if (viewMode === "month" || viewMode === "week") {
          const viewRange = getViewDateRange(viewMode, currentDate);
          params.startAfter = viewRange.startAfter;
          params.startBefore = viewRange.startBefore;
        }
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCity && selectedCity !== "All Wyoming") params.city = selectedCity;

        const [eventsRes, catsRes, orgsRes] = await Promise.all([
          eventsApi.list(params),
          categoriesApi.list(),
          organizationsApi.list(),
        ]);
        setEvents(eventsRes.data);
        setCategories(catsRes.data);
        setOrganizations(orgsRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setCategories, setOrganizations, datePreset, viewMode, currentDate, debouncedSearch, selectedCity]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (selectedCategories.length > 0) {
      result = result.filter((e) =>
        e.categories.some((c) => selectedCategories.includes(c.slug))
      );
    }
    if (selectedOrgIds.length > 0) {
      result = result.filter(
        (e) => e.organization && selectedOrgIds.includes(e.organization.id)
      );
    }
    return result;
  }, [events, selectedCategories, selectedOrgIds]);

  const upcomingEvents = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return filteredEvents.filter((e) => {
      return e.startAt.slice(0, 10) >= todayStr;
    });
  }, [filteredEvents]);

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
    const m = mode as "month" | "week" | "list" | "poster" | "map";
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

  const showCardGrid = viewMode !== "list" && viewMode !== "poster" && viewMode !== "map";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-400 px-6 py-10 text-white shadow-xl shadow-primary-500/20 sm:px-10 sm:py-14">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-800/30 blur-3xl" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {selectedCity === "All Wyoming" ? "Wyoming" : `${selectedCity}, Wyoming`}
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
          {(viewMode !== "poster" && viewMode !== "map") && (
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
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() =>               printCalendar({
                currentDate,
                events: upcomingEvents,
                title: "Community Calendar",
                primaryColor: "#4f46e5",
              })}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/60 px-3 text-sm font-semibold text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow hover:text-gray-700"
              title="Print monthly calendar"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <ViewToggle current={viewMode} onChange={handleViewChange} excludeViews={["week"]} />
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search events..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-gray-200/80 bg-white/60 py-2 pl-10 pr-4 text-sm shadow-sm backdrop-blur-sm placeholder:text-gray-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            aria-label="Search events"
          />
        </div>

        {/* Date presets */}
        <div className="flex flex-wrap gap-2">
          {(["all", "today", "tomorrow", "weekend", "next7"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                datePreset === preset
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-white/60 text-gray-600 shadow-sm hover:bg-white hover:text-gray-800"
              }`}
            >
              {preset === "all" ? "All events" : preset === "today" ? "Today" : preset === "tomorrow" ? "Tomorrow" : preset === "weekend" ? "This weekend" : "Next 7 days"}
            </button>
          ))}
        </div>

        {/* Location & Organization filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200/80 bg-white/60 py-2 pl-9 pr-8 text-sm font-medium shadow-sm backdrop-blur-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              aria-label="Filter by city"
            >
              {WYOMING_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <OrgFilterDropdown
            organizations={organizations}
            selectedCity={selectedCity}
            selectedOrgIds={selectedOrgIds}
            onToggle={toggleOrgFilter}
            onClear={clearOrgFilter}
          />
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
                  events={upcomingEvents}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                  selectedEventId={expandedEventId}
                />
              )}
              {viewMode === "week" && (
                <WeekView
                  currentDate={currentDate}
                  events={upcomingEvents}
                  onEventClick={handleEventClick}
                  selectedEventId={expandedEventId}
                />
              )}
              {viewMode === "list" && (
                <ListView events={upcomingEvents} />
              )}
              {viewMode === "poster" && (
                <PosterView events={upcomingEvents} />
              )}
              {viewMode === "map" && (
                <MapView events={upcomingEvents} onEventClick={handleEventClick} />
              )}
            </div>

            {/* Event cards below calendar */}
            {showCardGrid && upcomingEvents.length > 0 && (
              <div className="mt-4">
                <EventCardGrid
                  events={upcomingEvents}
                  categories={categories}
                  expandedEventId={expandedEventId}
                  onEventClick={handleEventClick}
                  collapsedCategories={collapsedCategories}
                  onToggleCategory={handleToggleCategoryGroup}
                />
              </div>
            )}

            {/* Site sponsors */}
            <SiteSponsors />

            {/* Digest signup */}
            <div className="mt-12">
              <DigestSignup />
            </div>

            {/* Footer links - required for OAuth branding verification */}
            <footer className="mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-primary-600 hover:underline">Privacy Policy</Link>
              <span className="text-gray-300">·</span>
              <Link to="/terms" className="hover:text-primary-600 hover:underline">Terms of Service</Link>
              <span className="text-gray-300">·</span>
              <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 hover:underline">Facebook Privacy</a>
              <span className="text-gray-300">·</span>
              <a href="https://www.facebook.com/terms.php" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 hover:underline">Facebook Terms</a>
              <span className="text-gray-300">·</span>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 hover:underline">Google Privacy</a>
              <span className="text-gray-300">·</span>
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 hover:underline">Google Terms</a>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
