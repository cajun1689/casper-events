import { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import type { EventWithDetails } from "@cyh/shared";
import { Colors } from "@/lib/constants";

const DEFAULT_REGION = {
  latitude: 42.8666,
  longitude: -106.3131,
  latitudeDelta: 2.5,
  longitudeDelta: 3.5,
};

interface Props {
  events: EventWithDetails[];
}

export function MapViewScreen({ events }: Props) {
  const router = useRouter();

  const withCoords = useMemo(
    () =>
      events.filter(
        (e) =>
          e.latitude != null &&
          e.longitude != null &&
          !Number.isNaN(e.latitude) &&
          !Number.isNaN(e.longitude),
      ),
    [events],
  );

  const region = useMemo(() => {
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
      latitudeDelta: Math.max((maxLat - minLat) * 1.3, 0.05),
      longitudeDelta: Math.max((maxLng - minLng) * 1.3, 0.05),
    };
  }, [withCoords]);

  if (withCoords.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No events with map locations to display.
        </Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton
      accessibilityLabel="Event locations map"
    >
      {withCoords.map((event) => {
        const start = parseISO(event.startAt);
        const pinColor =
          event.categories[0]?.color ?? Colors.primary;

        return (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.latitude!,
              longitude: event.longitude!,
            }}
            pinColor={pinColor}
            accessibilityLabel={`${event.title} at ${event.venueName || event.address || "unknown location"}`}
          >
            <Callout
              onPress={() => router.push(`/events/${event.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`View ${event.title}`}
            >
              <View style={styles.callout}>
                <Text style={styles.calloutTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                <Text style={styles.calloutDate}>
                  {format(start, "EEE, MMM d")} ·{" "}
                  {event.allDay ? "All Day" : format(start, "h:mm a")}
                </Text>
                {event.venueName && (
                  <Text style={styles.calloutVenue} numberOfLines={1}>
                    📍 {event.venueName}
                  </Text>
                )}
                <Text style={styles.calloutCta}>Tap for details →</Text>
              </View>
            </Callout>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height - 280,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  callout: {
    width: 200,
    padding: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  calloutDate: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 2,
  },
  calloutVenue: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  calloutCta: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },
});
