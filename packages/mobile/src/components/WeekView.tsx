import { useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  parseISO,
} from "date-fns";
import { useRouter } from "expo-router";
import type { EventWithDetails } from "@cyh/shared";
import { Colors } from "@/lib/constants";

interface Props {
  events: EventWithDetails[];
  currentDate: Date;
}

export function WeekView({ events, currentDate }: Props) {
  const router = useRouter();

  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventWithDetails[]>();
    for (const event of events) {
      const key = event.startAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  return (
    <ScrollView style={styles.container}>
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayEvents = eventsByDate.get(key) ?? [];
        const today = isToday(day);

        return (
          <View key={key} style={styles.daySection}>
            <View
              style={[styles.dayHeader, today && styles.dayHeaderToday]}
            >
              <Text style={styles.dayName}>{format(day, "EEE")}</Text>
              <View
                style={[styles.dayNumber, today && styles.dayNumberToday]}
              >
                <Text
                  style={[
                    styles.dayNumberText,
                    today && styles.dayNumberTextToday,
                  ]}
                >
                  {format(day, "d")}
                </Text>
              </View>
              <Text style={styles.monthLabel}>{format(day, "MMM")}</Text>
            </View>

            <View style={styles.dayEvents}>
              {dayEvents.length === 0 ? (
                <Text style={styles.noEvents}>No events</Text>
              ) : (
                dayEvents.map((event) => {
                  const start = parseISO(event.startAt);
                  const catColor =
                    event.categories[0]?.color ?? Colors.primary;
                  return (
                    <Pressable
                      key={event.id}
                      style={[
                        styles.eventItem,
                        { borderLeftColor: catColor },
                      ]}
                      onPress={() => router.push(`/events/${event.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`${event.title}, ${event.allDay ? "All day" : format(start, "h:mm a")}`}
                    >
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventTime}>
                        {event.allDay
                          ? "All day"
                          : format(start, "h:mm a")}
                      </Text>
                      {event.venueName && (
                        <Text style={styles.eventVenue} numberOfLines={1}>
                          {event.venueName}
                        </Text>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  daySection: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    minHeight: 80,
  },
  dayHeader: {
    width: 56,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.border,
  },
  dayHeaderToday: {
    backgroundColor: Colors.primary + "08",
  },
  dayName: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dayNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  dayNumberToday: {
    backgroundColor: Colors.primary,
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  dayNumberTextToday: {
    color: Colors.textInverse,
  },
  monthLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
  },
  dayEvents: {
    flex: 1,
    padding: 6,
    gap: 4,
  },
  noEvents: {
    fontSize: 12,
    color: Colors.textSecondary + "80",
    fontStyle: "italic",
    paddingVertical: 6,
    textAlign: "center",
  },
  eventItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  eventTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  eventVenue: {
    fontSize: 11,
    color: Colors.textSecondary + "99",
    marginTop: 1,
  },
});
