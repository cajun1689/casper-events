import { useState, useMemo, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
} from "react-native";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/theme";
import { resolveSolidColor as resolveColor, hexToRgba } from "@/lib/event-colors";
import type { EventWithDetails } from "@cyh/shared";

const DEFAULT_REGION: Region = {
  latitude: 42.8666,
  longitude: -106.3131,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
};

interface EventMapViewProps {
  events: EventWithDetails[];
}

export function EventMapView({ events }: EventMapViewProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null);

  const withCoords = useMemo(
    () =>
      events.filter(
        (e) =>
          e.latitude != null &&
          e.longitude != null &&
          !Number.isNaN(e.latitude) &&
          !Number.isNaN(e.longitude)
      ),
    [events]
  );

  const initialRegion = useMemo(() => {
    if (withCoords.length === 0) return DEFAULT_REGION;
    if (withCoords.length === 1) {
      return {
        latitude: withCoords[0].latitude!,
        longitude: withCoords[0].longitude!,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    const lats = withCoords.map((e) => e.latitude!);
    const lngs = withCoords.map((e) => e.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.05) * 1.4,
      longitudeDelta: Math.max(maxLng - minLng, 0.05) * 1.4,
    };
  }, [withCoords]);

  const handleMarkerPress = useCallback((event: EventWithDetails) => {
    setSelectedEvent(event);
  }, []);

  const handleNavigateToEvent = useCallback(() => {
    if (selectedEvent) {
      router.push(`/events/${selectedEvent.id}`);
    }
  }, [selectedEvent, router]);

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="map-outline" size={48} color={theme.textTertiary} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No events to display on the map
        </Text>
      </View>
    );
  }

  if (withCoords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="map-outline" size={48} color={theme.textTertiary} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No events have map locations yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        onPress={() => setSelectedEvent(null)}
      >
        {withCoords.map((event) => {
          const markerColor = resolveColor(event);
          return (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.latitude!,
                longitude: event.longitude!,
              }}
              pinColor={markerColor}
              onPress={() => handleMarkerPress(event)}
              tracksViewChanges={false}
            />
          );
        })}
      </MapView>

      {/* Bottom card for selected event */}
      {selectedEvent && (
        <Pressable
          style={[styles.bottomCard, shadows.lg, { backgroundColor: theme.surface }]}
          onPress={handleNavigateToEvent}
          accessibilityLabel={`View ${selectedEvent.title}`}
          accessibilityRole="link"
        >
          {(() => {
            const imageUri = selectedEvent.imageUrl
              ? selectedEvent.imageUrl.startsWith("http")
                ? selectedEvent.imageUrl
                : `https://casperevents.org${selectedEvent.imageUrl}`
              : null;
            const eventColor = resolveColor(selectedEvent);
            const start = new Date(selectedEvent.startAt);
            const timeStr = selectedEvent.allDay
              ? "All day"
              : format(start, "h:mm a");

            return (
              <View style={styles.bottomCardRow}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.bottomCardImage}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.bottomCardImagePlaceholder,
                      { backgroundColor: hexToRgba(eventColor, 0.15) },
                    ]}
                  >
                    <Ionicons name="calendar" size={20} color={hexToRgba(eventColor, 0.5)} />
                  </View>
                )}
                <View style={styles.bottomCardContent}>
                  <Text
                    style={[styles.bottomCardTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {selectedEvent.title}
                  </Text>
                  <Text
                    style={[styles.bottomCardMeta, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {format(start, "EEE, MMM d")} · {timeStr}
                  </Text>
                  {selectedEvent.venueName && (
                    <Text
                      style={[styles.bottomCardMeta, { color: theme.textTertiary }]}
                      numberOfLines={1}
                    >
                      {selectedEvent.venueName}
                    </Text>
                  )}
                  {selectedEvent.categories && selectedEvent.categories.length > 0 && (
                    <View style={styles.bottomCardTags}>
                      {selectedEvent.categories.slice(0, 2).map((cat) => (
                        <View
                          key={cat.id}
                          style={[
                            styles.bottomCardTag,
                            {
                              backgroundColor: hexToRgba(
                                cat.color || colors.primary[600],
                                0.1
                              ),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.bottomCardTagText,
                              { color: cat.color || colors.primary[600] },
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </View>
            );
          })()}
        </Pressable>
      )}
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    height: SCREEN_HEIGHT * 0.45,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  emptyText: {
    ...typography.callout,
    textAlign: "center",
    paddingHorizontal: spacing["3xl"],
  },
  bottomCard: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  bottomCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bottomCardImage: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
  },
  bottomCardImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomCardContent: {
    flex: 1,
    gap: 2,
  },
  bottomCardTitle: {
    ...typography.body,
    fontWeight: "600",
  },
  bottomCardMeta: {
    ...typography.caption,
  },
  bottomCardTags: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 2,
  },
  bottomCardTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  bottomCardTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
