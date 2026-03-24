import { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  View,
  Pressable,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/src/theme";
import { organizationsApi, eventsApi } from "@/src/lib/api";
import { EventCard } from "@/src/components/EventCard";
import { SkeletonList } from "@/src/components/SkeletonCard";
import type { OrganizationPublic, EventWithDetails } from "@cyh/shared";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ContactRow({
  icon,
  text,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const content = (
    <View style={contactStyles.row}>
      <Ionicons name={icon} size={18} color={theme.textSecondary} />
      <Text
        style={[
          contactStyles.text,
          { color: onPress ? theme.tint : theme.text },
        ]}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="link">
        {content}
      </Pressable>
    );
  }
  return content;
}

const contactStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.body,
    flex: 1,
  },
});

export default function OrgDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useAppTheme();
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

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <SkeletonList count={2} />
        </View>
      </>
    );
  }

  if (!org) {
    return (
      <>
        <Stack.Screen options={{ title: "Organization" }} />
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            {error || "Organization not found"}
          </Text>
        </View>
      </>
    );
  }

  const hasContact = org.website || org.email || org.phone || org.address;

  return (
    <>
      <Stack.Screen options={{ title: org.name }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.headerCard, shadows.sm, { backgroundColor: theme.surface }]}>
          <View style={styles.headerRow}>
            {org.logoUrl ? (
              <Image
                source={{ uri: org.logoUrl }}
                style={styles.logo}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <View style={[styles.initialCircle, { backgroundColor: hexToRgba(colors.primary[600], 0.1) }]}>
                <Text style={[styles.initialText, { color: colors.primary[600] }]}>
                  {org.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[styles.orgName, { color: theme.text }]}>{org.name}</Text>
          </View>

          {org.description && (
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {org.description}
            </Text>
          )}

          {hasContact && (
            <View style={[styles.contactSection, { borderTopColor: theme.borderLight }]}>
              {org.website && (
                <ContactRow
                  icon="globe-outline"
                  text={org.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  onPress={() => Linking.openURL(org.website!)}
                />
              )}
              {org.email && (
                <ContactRow
                  icon="mail-outline"
                  text={org.email}
                  onPress={() => Linking.openURL(`mailto:${org.email}`)}
                />
              )}
              {org.phone && (
                <ContactRow
                  icon="call-outline"
                  text={org.phone}
                  onPress={() => Linking.openURL(`tel:${org.phone}`)}
                />
              )}
              {org.address && (
                <ContactRow
                  icon="location-outline"
                  text={org.address}
                />
              )}
            </View>
          )}
        </View>

        <View style={styles.eventsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Upcoming Events
          </Text>
          {events.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Ionicons name="calendar-outline" size={36} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No upcoming events
              </Text>
            </View>
          ) : (
            events.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing["4xl"] },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.headline,
  },
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
  },
  initialCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  initialText: {
    fontSize: 28,
    fontWeight: "700",
  },
  orgName: {
    ...typography.title,
    flex: 1,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  contactSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  eventsSection: {
    marginTop: spacing["2xl"],
  },
  sectionTitle: {
    ...typography.headline,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyEvents: {
    alignItems: "center",
    padding: spacing["3xl"],
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.callout,
  },
});
