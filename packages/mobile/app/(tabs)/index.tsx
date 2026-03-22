import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { format } from "date-fns";

import { useColorScheme } from "@/components/useColorScheme";
import { Text as ThemedText } from "@/components/Themed";
import { eventsApi } from "@/src/lib/api";
import { getSelectedCity, setSelectedCity } from "@/src/lib/city-storage";
import {
  WYOMING_CITIES,
  ALL_WYOMING_VALUE,
} from "@/src/lib/wyoming-cities";
import type { EventWithDetails } from "@cyh/shared";

function EventRow({ event }: { event: EventWithDetails }) {
  return (
    <Link href={`/events/${event.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.eventRow, pressed && styles.eventRowPressed]}
        accessibilityLabel={`${event.title}, ${event.venueName || "TBD"}`}
        accessibilityRole="link"
      >
        <View style={styles.eventRowContent}>
          <ThemedText style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </ThemedText>
          <ThemedText style={styles.eventMeta} numberOfLines={1}>
            {format(new Date(event.startAt), "EEE, MMM d · h:mm a")}
            {event.venueName ? ` · ${event.venueName}` : ""}
          </ThemedText>
        </View>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCityState] = useState<string | null | undefined>(
    undefined
  );
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCity = useCallback(async () => {
    const city = await getSelectedCity();
    setSelectedCityState(city);
  }, []);

  const fetchEvents = useCallback(async () => {
    setError(null);
    try {
      const params: Record<string, string> = {
        limit: "50",
      };
      if (
        selectedCity !== undefined &&
        selectedCity !== null &&
        selectedCity !== ALL_WYOMING_VALUE
      ) {
        params.city = selectedCity;
      }
      const res = await eventsApi.list(params);
      setEvents(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity]);

  useFocusEffect(
    useCallback(() => {
      loadCity();
    }, [loadCity])
  );

  useEffect(() => {
    if (selectedCity === undefined) return;
    setLoading(true);
    void fetchEvents();
  }, [selectedCity, fetchEvents]);

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
    setLoading(true);
  };

  const displayCity =
    selectedCity === undefined || selectedCity === null
      ? ALL_WYOMING_VALUE
      : selectedCity;

  if (selectedCity === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cityFilter}>
        <ThemedText style={styles.cityLabel}>Showing:</ThemedText>
        <Pressable
          onPress={() => setCityPickerOpen(!cityPickerOpen)}
          style={[
            styles.cityButton,
            { backgroundColor: colorScheme === "dark" ? "#333" : "#eee" },
          ]}
          accessibilityLabel={`Filter by city. Current: ${displayCity}`}
          accessibilityRole="button"
        >
          <ThemedText>{displayCity}</ThemedText>
        </Pressable>
        {cityPickerOpen && (
          <View style={[styles.cityList, { backgroundColor: colorScheme === "dark" ? "#222" : "#f5f5f5" }]}>
            <FlatList
              data={WYOMING_CITIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectCity(item)}
                  style={({ pressed }) => [
                    styles.cityItem,
                    pressed && styles.cityItemPressed,
                  ]}
                  accessibilityLabel={item}
                  accessibilityRole="button"
                >
                  <ThemedText
                    style={
                      (item === displayCity || (item === ALL_WYOMING_VALUE && !selectedCity))
                        ? styles.cityItemSelected
                        : undefined
                    }
                  >
                    {item}
                  </ThemedText>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>

      {error && (
        <View style={styles.error}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventRow event={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText>No events found.</ThemedText>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cityFilter: {
    padding: 12,
  },
  cityLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  cityButton: {
    padding: 10,
    borderRadius: 8,
  },
  cityList: {
    maxHeight: 200,
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  cityItem: {
    padding: 12,
  },
  cityItemPressed: {
    opacity: 0.6,
  },
  cityItemSelected: {
    fontWeight: "600",
  },
  eventRow: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  eventRowPressed: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  eventRowContent: {},
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  eventMeta: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 4,
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  error: {
    padding: 12,
    backgroundColor: "#fee",
  },
  errorText: {
    color: "#c00",
  },
});
