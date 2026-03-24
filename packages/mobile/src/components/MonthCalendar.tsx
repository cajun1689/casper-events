import { useState, useMemo } from "react";
import { StyleSheet, Text, View, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/src/theme";
import { EventRow } from "@/src/components/EventRow";
import type { EventWithDetails } from "@cyh/shared";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MonthCalendarProps {
  events: EventWithDetails[];
}

export function MonthCalendar({ events }: MonthCalendarProps) {
  const theme = useAppTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventWithDetails[]>();
    for (const event of events) {
      const key = format(new Date(event.startAt), "yyyy-MM-dd");
      const existing = map.get(key);
      if (existing) existing.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return eventsByDate.get(key) || [];
  }, [selectedDate, eventsByDate]);

  const goToPrevMonth = () => {
    Haptics.selectionAsync();
    setCurrentMonth((m) => subMonths(m, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    Haptics.selectionAsync();
    setCurrentMonth((m) => addMonths(m, 1));
    setSelectedDate(null);
  };

  const handleDayPress = (day: Date) => {
    Haptics.selectionAsync();
    if (selectedDate && isSameDay(day, selectedDate)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
    }
  };

  return (
    <View>
      {/* Month header */}
      <View style={styles.monthHeader}>
        <Pressable onPress={goToPrevMonth} hitSlop={12} accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={22} color={theme.tint} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: theme.text }]}>
          {format(currentMonth, "MMMM yyyy")}
        </Text>
        <Pressable onPress={goToNextMonth} hitSlop={12} accessibilityLabel="Next month">
          <Ionicons name="chevron-forward" size={22} color={theme.tint} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: theme.textTertiary }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {calendarDays.map((day, i) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dayEvents = eventsByDate.get(dateKey);
          const hasEvents = !!dayEvents && dayEvents.length > 0;
          const dotCount = Math.min(dayEvents?.length || 0, 3);

          return (
            <Pressable
              key={i}
              onPress={() => handleDayPress(day)}
              style={[
                styles.dayCell,
                selected && [styles.dayCellSelected, { backgroundColor: colors.primary[600] }],
                today && !selected && [styles.dayCellToday, { borderColor: colors.primary[600] }],
              ]}
              accessibilityLabel={`${format(day, "EEEE, MMMM d")}${hasEvents ? `, ${dayEvents!.length} events` : ""}`}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: inMonth ? theme.text : theme.textTertiary },
                  selected && styles.dayTextSelected,
                ]}
              >
                {format(day, "d")}
              </Text>
              {hasEvents && (
                <View style={styles.dotRow}>
                  {Array.from({ length: dotCount }).map((_, di) => {
                    const evColor = dayEvents![di]?.categories?.[0]?.color || colors.primary[600];
                    return (
                      <View
                        key={di}
                        style={[
                          styles.dot,
                          { backgroundColor: selected ? "#fff" : evColor },
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected day events */}
      {selectedDate && (
        <View style={[styles.eventsSection, { borderTopColor: theme.borderLight }]}>
          <Text style={[styles.eventsTitle, { color: theme.text }]}>
            {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE, MMMM d")}
          </Text>
          {selectedDateEvents.length === 0 ? (
            <View style={styles.noEvents}>
              <Text style={[styles.noEventsText, { color: theme.textSecondary }]}>
                No events on this day
              </Text>
            </View>
          ) : (
            <View style={[styles.eventsList, shadows.sm, { backgroundColor: theme.cardBackground, borderRadius: radii.lg }]}>
              {selectedDateEvents.map((event, idx) => (
                <View key={event.id}>
                  <EventRow event={event} />
                  {idx < selectedDateEvents.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  monthTitle: {
    ...typography.headline,
  },
  weekdayRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
  },
  weekdayCell: {
    width: CELL_SIZE,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  weekdayText: {
    ...typography.caption,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.sm,
  },
  dayCell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    gap: 2,
  },
  dayCellSelected: {
    borderRadius: radii.full,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderRadius: radii.full,
  },
  dayText: {
    ...typography.callout,
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    position: "absolute",
    bottom: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventsSection: {
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  eventsTitle: {
    ...typography.headline,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  noEvents: {
    padding: spacing["2xl"],
    alignItems: "center",
  },
  noEventsText: {
    ...typography.callout,
  },
  eventsList: {
    marginHorizontal: spacing.lg,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 48 + spacing.md,
  },
});
