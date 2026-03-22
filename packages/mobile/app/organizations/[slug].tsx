import { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack, Link } from "expo-router";
import { Text, View } from "@/components/Themed";
import { organizationsApi, eventsApi } from "@/src/lib/api";
import { format } from "date-fns";
import type { OrganizationPublic } from "@cyh/shared";
import type { EventWithDetails } from "@cyh/shared";

export default function OrgDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [org, setOrg] = useState<OrganizationPublic | null>(null);
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    organizationsApi
      .get(slug)
      .then(async (orgData) => {
        setOrg(orgData);
        const eventsRes = await eventsApi.list({
          orgId: orgData.id,
          limit: "50",
        });
        setEvents(eventsRes.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading || !org) {
    return (
      <>
        <Stack.Screen options={{ title: "Organization" }} />
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <Text>{error || "Organization not found"}</Text>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: org.name }} />
      <ScrollView style={styles.container}>
        {org.logoUrl && (
          <Image
            source={{ uri: org.logoUrl }}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel={`${org.name} logo`}
          />
        )}
        <View style={styles.content}>
          <Text style={styles.name}>{org.name}</Text>
          {org.description && (
            <Text style={styles.description}>{org.description}</Text>
          )}
          {org.website && (
            <Pressable
              onPress={() => Linking.openURL(org.website!)}
              accessibilityLabel={`Visit ${org.name} website`}
              accessibilityRole="link"
            >
              <Text style={styles.link}>{org.website}</Text>
            </Pressable>
          )}
          <Text style={styles.eventsTitle}>Upcoming events</Text>
          {events.length === 0 ? (
            <Text style={styles.empty}>No upcoming events.</Text>
          ) : (
            events.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.eventRow,
                    pressed && styles.eventRowPressed,
                  ]}
                  accessibilityLabel={`${e.title}, ${format(new Date(e.startAt), "MMM d")}`}
                  accessibilityRole="link"
                >
                  <View>
                    <Text style={styles.eventTitle}>{e.title}</Text>
                    <Text style={styles.eventMeta}>
                      {format(new Date(e.startAt), "EEE, MMM d · h:mm a")}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ))
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
  logo: {
    width: "100%",
    height: 120,
    backgroundColor: "#f5f5f5",
  },
  content: { padding: 16 },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  link: { color: "#2563eb", marginBottom: 16 },
  eventsTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  empty: { opacity: 0.7 },
  eventRow: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  eventRowPressed: { opacity: 0.7 },
  eventTitle: { fontSize: 16, fontWeight: "600" },
  eventMeta: { fontSize: 13, opacity: 0.8, marginTop: 4 },
});
