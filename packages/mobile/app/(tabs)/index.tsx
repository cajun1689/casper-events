import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format, parseISO } from "date-fns";

import { useAppTheme } from "@/hooks/useAppTheme";
import { colors, spacing, radii, typography } from "@/theme";
import { eventsApi, categoriesApi } from "@/lib/api";
import { getSelectedCity, setSelectedCity } from "@/lib/city-storage";
import { getDefaultViewMode, setDefaultViewMode } from "@/lib/view-storage";
import { getFilteredOrgIds } from "@/lib/org-filter-storage";
import { WYOMING_CITIES, ALL_WYOMING_VALUE } from "@/lib/wyoming-cities";
import { SearchBar } from "@/components/SearchBar";
import { DatePresets, getDateRange, type PresetKey } from "@/components/DatePresets";
import { CategoryPills } from "@/components/CategoryPills";
import { EventCard } from "@/components/EventCard";
import { EventRow } from "@/components/EventRow";
import { SectionDateHeader } from "@/components/SectionDateHeader";
import { SkeletonList } from "@/components/SkeletonCard";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { MonthCalendar } from "@/components/MonthCalendar";
import { PosterCard } from "@/components/PosterCard";
import { EventMapView } from "@/components/EventMapView";
import type { EventWithDetails, CategoryPublic } from "@cyh/shared";

function groupEventsByDate(events: EventWithDetails[]) {
  const groups: Map<string, EventWithDetails[]> = new Map();
  for (const event of events) {
    const key = event.startAt.slice(0, 10);
    const existing = groups.get(key);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(key, [event]);
    }
  }
  return Array.from(groups.entries()).map(([dateKey, data]) => ({
    dateKey,
    data,
  }));
}

function monthLabel(key: string, short = false): string {
  const [y, m] = key.split("-").map(Number);
  return format(new Date(y, m - 1, 1), short ? "MMM yyyy" : "MMMM yyyy");
}

function groupEventsByMonth(events: EventWithDetails[]) {
  const groups: Map<string, EventWithDetails[]> = new Map();
  for (const event of events) {
    const key = event.startAt.slice(0, 7);
    const existing = groups.get(key);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(key, [event]);
    }
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, data]) => ({
      monthKey,
      label: monthLabel(monthKey),
      data,
    }));
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewModeState] = useState<ViewMode>("cards");
  const [viewModeLoaded, setViewModeLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<PresetKey>("all");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [selectedCity, setSelectedCityState] = useState<string | null | undefined>(undefined);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [filteredOrgIds, setFilteredOrgIds] = useState<Set<string>>(new Set());
  const [selectedPosterMonth, setSelectedPosterMonth] = useState<string | null>(null);
  const posterScrollRef = useRef<ScrollView>(null);
  const monthSectionRefs = useRef<Record<string, View | null>>({});

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    setDefaultViewMode(mode);
  }, []);

  const loadCity = useCallback(async () => {
    const city = await getSelectedCity();
    setSelectedCityState(city);
  }, []);

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data)).catch(() => {});
    getDefaultViewMode().then((mode) => {
      setViewModeState(mode);
      setViewModeLoaded(true);
    });
  }, []);

  const fetchEvents = useCallback(async () => {
    setError(null);
    try {
      const params: Record<string, string> = { limit: "50" };

      if (selectedCity && selectedCity !== ALL_WYOMING_VALUE) {
        params.city = selectedCity;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const dateRange = getDateRange(datePreset);
      if (dateRange.startAfter) params.startAfter = dateRange.startAfter;
      if (dateRange.startBefore) params.startBefore = dateRange.startBefore;

      if (selectedCats.size > 0) {
        params.categories = Array.from(selectedCats).join(",");
      }

      const res = await eventsApi.list(params);
      setEvents(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, search, datePreset, selectedCats]);

  useFocusEffect(
    useCallback(() => {
      loadCity();
      getFilteredOrgIds().then((ids) => setFilteredOrgIds(new Set(ids)));
    }, [loadCity])
  );

  useEffect(() => {
    if (selectedCity === undefined) return;
    setLoading(true);
    void fetchEvents();
  }, [fetchEvents, selectedCity]);

  useEffect(() => {
    loadCity();
  }, [loadCity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleSelectCity = async (city: string) => {
    const value = city === ALL_WYOMING_VALUE ? null : city;
    await setSelectedCity(value);
    setSelectedCityState(value);
    setCityPickerOpen(false);
    Haptics.selectionAsync();
  };

  const toggleCategory = useCallback((id: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const displayCity =
    selectedCity === undefined || selectedCity === null
      ? ALL_WYOMING_VALUE
      : selectedCity;

  const displayEvents = useMemo(() => {
    if (filteredOrgIds.size === 0) return events;
    return events.filter(
      (e) => e.organization && filteredOrgIds.has(e.organization.id)
    );
  }, [events, filteredOrgIds]);

  const sections = useMemo(() => groupEventsByDate(displayEvents), [displayEvents]);

  const filtersBar = (
    <>
      <View style={styles.filterRow}>
        <DatePresets selected={datePreset} onSelect={setDatePreset} />
      </View>

      {categories.length > 0 && (
        <View style={styles.filterRow}>
          <CategoryPills
            categories={categories}
            selected={selectedCats}
            onToggle={toggleCategory}
          />
        </View>
      )}

      <View style={styles.cityRow}>
        <Pressable
          onPress={() => setCityPickerOpen(!cityPickerOpen)}
          style={[styles.cityChip, { backgroundColor: theme.surfaceSecondary }]}
          accessibilityLabel={`Filter by city. Current: ${displayCity}`}
          accessibilityRole="button"
        >
          <Ionicons name="location" size={14} color={theme.tint} />
          <Text style={[styles.cityChipText, { color: theme.text }]} numberOfLines={1}>
            {displayCity}
          </Text>
          <Ionicons
            name={cityPickerOpen ? "chevron-up" : "chevron-down"}
            size={14}
            color={theme.textSecondary}
          />
        </Pressable>

        {selectedCats.size > 0 && (
          <Pressable
            onPress={() => setSelectedCats(new Set())}
            style={styles.clearBtn}
            accessibilityLabel="Clear filters"
          >
            <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
            <Text style={[styles.clearText, { color: theme.textTertiary }]}>Clear</Text>
          </Pressable>
        )}
      </View>

      {cityPickerOpen && (
        <View style={[styles.cityList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ScrollView style={styles.cityScroll} nestedScrollEnabled>
            {WYOMING_CITIES.map((city) => {
              const active =
                city === displayCity ||
                (city === ALL_WYOMING_VALUE && !selectedCity);
              return (
                <Pressable
                  key={city}
                  onPress={() => handleSelectCity(city)}
                  style={({ pressed }) => [
                    styles.cityItem,
                    active && { backgroundColor: theme.surfaceSecondary },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.cityItemText,
                      { color: theme.text },
                      active && { color: theme.tint, fontWeight: "600" },
                    ]}
                  >
                    {city}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={theme.tint} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </>
  );

  const errorBanner = error ? (
    <View style={[styles.errorBanner, { backgroundColor: colors.red[50] }]}>
      <Text style={[styles.errorText, { color: colors.red[600] }]}>{error}</Text>
      <Pressable onPress={onRefresh}>
        <Text style={[styles.retryText, { color: colors.red[600] }]}>Retry</Text>
      </Pressable>
    </View>
  ) : null;

  const emptyComponent = (
    <View style={styles.empty}>
      <Ionicons name="calendar-outline" size={48} color={theme.textTertiary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No events found
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {search || selectedCats.size > 0 || datePreset !== "all"
          ? "Try adjusting your filters"
          : `No upcoming events${selectedCity ? ` in ${selectedCity}` : ""}`}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      <View style={styles.viewToggleRow}>
        <ViewToggle selected={viewMode} onSelect={setViewMode} />
      </View>

      {filtersBar}
      {errorBanner}
    </View>
  );

  if (selectedCity === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SkeletonList />
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderHeader()}
        <SkeletonList />
      </View>
    );
  }

  // Poster view -- colorful cards grouped by month
  if (viewMode === "poster") {
    const monthGroups = groupEventsByMonth(displayEvents);
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          ref={posterScrollRef}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
          }
          contentContainerStyle={styles.listContent}
        >
          {renderHeader()}
          {displayEvents.length === 0 ? (
            emptyComponent
          ) : (
            <>
              {monthGroups.length > 1 && (
                <View style={styles.monthJumpRow}>
                  {monthGroups.map(({ monthKey }) => {
                    const active = selectedPosterMonth === monthKey;
                    return (
                      <Pressable
                        key={monthKey}
                        onPress={() => {
                          setSelectedPosterMonth(monthKey);
                          Haptics.selectionAsync();
                          const ref = monthSectionRefs.current[monthKey];
                          if (ref) ref.measureLayout(
                            posterScrollRef.current as any,
                            (_x: number, y: number) => posterScrollRef.current?.scrollTo({ y, animated: true }),
                            () => {},
                          );
                        }}
                        style={[
                          styles.monthJumpPill,
                          { backgroundColor: active ? colors.primary[600] : theme.surfaceSecondary },
                        ]}
                      >
                        <Text style={[
                          styles.monthJumpText,
                          { color: active ? "#fff" : theme.textSecondary },
                        ]}>
                          {monthLabel(monthKey, true)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              {monthGroups.map(({ monthKey, label, data }) => (
                <View
                  key={monthKey}
                  ref={(el) => { monthSectionRefs.current[monthKey] = el; }}
                  style={styles.posterMonthGroup}
                >
                  <Text style={[styles.monthGroupTitle, { color: theme.text }]}>{label}</Text>
                  <View style={styles.posterGrid}>
                    {data.map((event) => (
                      <PosterCard key={event.id} event={event} />
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // Calendar view uses ScrollView instead of SectionList/FlatList
  if (viewMode === "calendar") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
          }
          contentContainerStyle={styles.listContent}
        >
          {renderHeader()}
          {displayEvents.length === 0 ? emptyComponent : <MonthCalendar events={displayEvents} />}
        </ScrollView>
      </View>
    );
  }

  // Map view -- full-screen map with event markers
  if (viewMode === "map") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.mapHeaderWrap}>
          <ScrollView
            contentContainerStyle={styles.mapHeaderScroll}
            nestedScrollEnabled
            bounces={false}
          >
            {renderHeader()}
          </ScrollView>
        </View>
        <View style={styles.mapFill}>
          <EventMapView events={displayEvents} />
        </View>
      </View>
    );
  }

  // List view -- compact rows grouped by date
  if (viewMode === "list") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventRow event={item} />}
          renderSectionHeader={({ section }) => (
            <SectionDateHeader dateKey={section.dateKey} />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={emptyComponent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <View style={[styles.rowSeparator, { backgroundColor: theme.borderLight }]} />
          )}
        />
      </View>
    );
  }

  // Cards view (default) -- rich cards grouped by date
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        renderSectionHeader={({ section }) => (
          <SectionDateHeader dateKey={section.dateKey} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={emptyComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  viewToggleRow: {
    marginBottom: spacing.md,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  cityChipText: {
    ...typography.callout,
    fontWeight: "500",
    maxWidth: 150,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearText: {
    ...typography.caption,
  },
  cityList: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    maxHeight: 200,
    overflow: "hidden",
  },
  cityScroll: {
    maxHeight: 200,
  },
  cityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cityItemText: {
    ...typography.body,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.callout,
    flex: 1,
  },
  retryText: {
    ...typography.callout,
    fontWeight: "600",
    marginLeft: spacing.md,
  },
  empty: {
    padding: spacing["4xl"],
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.headline,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.callout,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: spacing["3xl"],
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 48 + spacing.md,
  },
  monthGroupTitle: {
    ...typography.title,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.md,
  },
  posterMonthGroup: {
    marginBottom: spacing.md,
  },
  posterGrid: {
    paddingHorizontal: spacing.lg,
  },
  monthJumpRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  monthJumpPill: {
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  monthJumpText: {
    fontSize: 12,
    fontWeight: "700",
  },
  mapHeaderWrap: {
    flexShrink: 0,
    flexGrow: 0,
  },
  mapFill: {
    flex: 1,
  },
  mapHeaderScroll: {
    paddingBottom: spacing.sm,
  },
});
