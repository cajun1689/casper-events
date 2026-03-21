import { useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Clock, CalendarDays, ExternalLink, Ticket,
  DollarSign, Building2, ChevronDown, ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import type { EventWithDetails, CategoryPublic } from "@cyh/shared";

interface EventCardGridProps {
  events: EventWithDetails[];
  categories: CategoryPublic[];
  expandedEventId: string | null;
  onEventClick: (eventId: string) => void;
  collapsedCategories: Set<string>;
  onToggleCategory: (catSlug: string) => void;
}

interface CategoryGroup {
  category: { slug: string; name: string; icon: string | null; color: string | null };
  events: EventWithDetails[];
}

export function EventCardGrid({
  events,
  categories,
  expandedEventId,
  onEventClick,
  collapsedCategories,
  onToggleCategory,
}: EventCardGridProps) {
  const expandedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expandedEventId && expandedRef.current) {
      expandedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [expandedEventId]);

  const grouped = useMemo(() => {
    const catMap = new Map<string, CategoryGroup>();
    const uncategorized: EventWithDetails[] = [];

    for (const event of events) {
      if (event.categories.length === 0) {
        uncategorized.push(event);
        continue;
      }
      for (const cat of event.categories) {
        let group = catMap.get(cat.slug);
        if (!group) {
          group = { category: cat, events: [] };
          catMap.set(cat.slug, group);
        }
        if (!group.events.some((e) => e.id === event.id)) {
          group.events.push(event);
        }
      }
    }

    const catOrder = categories.map((c) => c.slug);
    const groups = [...catMap.values()].sort(
      (a, b) => catOrder.indexOf(a.category.slug) - catOrder.indexOf(b.category.slug),
    );

    if (uncategorized.length > 0) {
      groups.push({
        category: { slug: "__uncategorized", name: "Other Events", icon: null, color: null },
        events: uncategorized,
      });
    }

    return groups;
  }, [events, categories]);

  if (events.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Upcoming Events</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {grouped.map((group) => {
        const isCollapsed = collapsedCategories.has(group.category.slug);
        const color = group.category.color ?? "#4f46e5";

        return (
          <section key={group.category.slug} className="animate-fade-in">
            <button
              onClick={() => onToggleCategory(group.category.slug)}
              className="group mb-3 flex w-full items-center gap-3 text-left"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 14px -3px ${color}40` }}
              >
                {group.category.icon ? (
                  <span className="text-sm">{group.category.icon}</span>
                ) : (
                  <span className="text-xs font-extrabold">{group.category.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {group.category.name}
                </h3>
                <p className="text-[11px] font-medium text-gray-400">
                  {group.events.length} event{group.events.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-lg p-1 text-gray-400 transition-colors group-hover:bg-gray-100 group-hover:text-gray-600">
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {!isCollapsed && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.events.map((event) => {
                  const isExpanded = expandedEventId === event.id;
                  const start = parseISO(event.startAt);
                  const end = event.endAt ? parseISO(event.endAt) : null;
                  const timeDisplay = event.allDay ? "All day" : format(start, "h:mm a");
                  const mapUrl = event.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
                    : null;

                  return (
                    <div
                      key={event.id}
                      ref={isExpanded ? expandedRef : undefined}
                      className={clsx(
                        "overflow-hidden rounded-2xl border transition-all duration-300",
                        isExpanded
                          ? "border-primary-200/60 bg-white shadow-xl shadow-primary-100/40 sm:col-span-2 lg:col-span-3"
                          : "border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 hover:bg-white cursor-pointer",
                      )}
                      onClick={() => !isExpanded && onEventClick(event.id)}
                    >
                      {/* Collapsed card */}
                      <div className={clsx("p-4", isExpanded && "border-b border-gray-100")}>
                        <div className="flex items-start gap-3">
                          {/* Date badge */}
                          <div
                            className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 2px 8px -2px ${color}40` }}
                          >
                            <span className="text-[9px] font-bold uppercase leading-none opacity-80">
                              {format(start, "MMM")}
                            </span>
                            <span className="text-lg font-extrabold leading-tight">
                              {format(start, "d")}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className={clsx(
                              "text-sm font-bold transition-colors",
                              isExpanded ? "text-primary-700" : "text-gray-900",
                            )}>
                              {event.title}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeDisplay}
                              </span>
                              {event.venueName && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]">{event.venueName}</span>
                                </span>
                              )}
                            </div>
                            {event.organization && (
                              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                                {event.organization.logoUrl ? (
                                  <img src={event.organization.logoUrl} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                                ) : (
                                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[7px] font-bold text-white">
                                    {event.organization.name.charAt(0)}
                                  </span>
                                )}
                                <span className="font-medium">{event.organization.name}</span>
                              </p>
                            )}
                          </div>

                          {isExpanded ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); onEventClick(event.id); }}
                              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          ) : (
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300" />
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="animate-fade-in p-5 sm:p-6">
                          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                            <div>
                              {/* Image */}
                              {event.imageUrl && (
                                <div className="mb-5 aspect-[2.2/1] overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-50">
                                  <img src={event.imageUrl} alt={event.title} loading="lazy" className="h-full w-full object-cover" />
                                </div>
                              )}

                              {/* Description */}
                              {event.description && (
                                <div className="mb-5 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                                  {event.description}
                                </div>
                              )}

                              {/* Categories */}
                              {event.categories.length > 0 && (
                                <div className="mb-5 flex flex-wrap gap-1.5">
                                  {event.categories.map((cat) => (
                                    <span
                                      key={cat.id}
                                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                      style={{
                                        backgroundColor: cat.color ? `${cat.color}14` : "#4f46e514",
                                        color: cat.color ?? "#4f46e5",
                                      }}
                                    >
                                      {cat.icon && <span>{cat.icon}</span>}
                                      {cat.name}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex flex-wrap gap-3">
                                {event.ticketUrl && (
                                  <a
                                    href={event.ticketUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px"
                                  >
                                    <Ticket className="h-4 w-4" /> Get Tickets
                                  </a>
                                )}
                                <Link
                                  to={`/events/${event.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/60 px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow"
                                >
                                  View Full Page
                                </Link>
                              </div>
                            </div>

                            {/* Sidebar details */}
                            <div className="space-y-4 rounded-2xl bg-gray-50/80 p-5">
                              <DetailRow icon={CalendarDays} label="Date" value={format(start, "EEEE, MMMM d, yyyy")} />
                              <DetailRow
                                icon={Clock}
                                label="Time"
                                value={event.allDay ? "All day" : end ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}` : format(start, "h:mm a")}
                              />
                              {event.venueName && <DetailRow icon={MapPin} label="Venue" value={event.venueName} />}
                              {event.address && (
                                <div className="flex items-start gap-3 text-sm">
                                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                                    <MapPin className="h-3.5 w-3.5 text-primary-500" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Address</p>
                                    {mapUrl ? (
                                      <a
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                                      >
                                        {event.address}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    ) : (
                                      <p className="text-sm font-medium text-gray-700">{event.address}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {event.cost && <DetailRow icon={DollarSign} label="Cost" value={event.cost} />}

                              {/* Org info */}
                              <div className="border-t border-gray-200/60 pt-4">
                                <Link
                                  to={`/organizations/${event.organization.slug}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="group flex items-center gap-3"
                                >
                                  {event.organization.logoUrl ? (
                                    <img src={event.organization.logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover ring-2 ring-white" />
                                  ) : (
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white shadow-md shadow-primary-500/20">
                                      {event.organization.name.charAt(0)}
                                    </span>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-gray-900 transition-colors group-hover:text-primary-600">{event.organization.name}</p>
                                    <p className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                                      <Building2 className="h-3 w-3" /> Organizer
                                    </p>
                                  </div>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
        <Icon className="h-3.5 w-3.5 text-primary-500" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700">{value}</p>
      </div>
    </div>
  );
}
