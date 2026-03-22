import { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Text, View } from "@/components/Themed";
import { eventsApi } from "@/src/lib/api";
import { format } from "date-fns";
import type { EventWithDetails } from "@cyh/shared";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    eventsApi
      .get(id)
      .then(setEvent)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !event) {
    return (
      <>
        <Stack.Screen options={{ title: "Event" }} />
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <Text>{error || "Event not found"}</Text>
          )}
        </View>
      </>
    );
  }

  const venueLine = [event.venueName, event.address].filter(Boolean).join(" · ");
  const isOnline = event.isOnline && event.onlineEventUrl;

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <ScrollView style={styles.container}>
        {event.imageUrl && (
          <Image
            source={{
              uri: event.imageUrl.startsWith("http")
                ? event.imageUrl
                : `https://casperevents.org${event.imageUrl}`,
            }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={`Event image for ${event.title}`}
          />
        )}
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          {event.subtitle && (
            <Text style={styles.subtitle}>{event.subtitle}</Text>
          )}
          <Text style={styles.date}>
            {format(new Date(event.startAt), "EEEE, MMMM d, yyyy")}
            {event.endAt
              ? ` · ${format(new Date(event.endAt), "h:mm a")}`
              : event.allDay
                ? " · All day"
                : ` · ${format(new Date(event.startAt), "h:mm a")}`}
          </Text>
          {venueLine && !isOnline && (
            <Text style={styles.venue}>{venueLine}</Text>
          )}
          {event.organization && (
            <Text style={styles.org}>By {event.organization.name}</Text>
          )}
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}
          {event.ticketUrl && (
            <Pressable
              style={styles.button}
              onPress={() => Linking.openURL(event.ticketUrl!)}
              accessibilityLabel="Get tickets"
              accessibilityRole="link"
            >
              <Text style={styles.buttonText}>Get tickets</Text>
            </Pressable>
          )}
          {isOnline && event.onlineEventUrl && (
            <Pressable
              style={styles.button}
              onPress={() => Linking.openURL(event.onlineEventUrl!)}
              accessibilityLabel="Join online event"
              accessibilityRole="link"
            >
              <Text style={styles.buttonText}>Join online</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
  },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 16, opacity: 0.9, marginBottom: 8 },
  date: { fontSize: 14, marginBottom: 4 },
  venue: { fontSize: 14, marginBottom: 4 },
  org: { fontSize: 14, opacity: 0.8, marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600", textAlign: "center" },
});
