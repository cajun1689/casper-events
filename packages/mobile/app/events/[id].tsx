import { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  View,
  Pressable,
  Linking,
  Share,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, Stack, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker } from "react-native-maps";
import { format } from "date-fns";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/src/theme";
import { resolveSolidColor, hexToRgba } from "@/src/lib/event-colors";
import { eventsApi } from "@/src/lib/api";
import { SkeletonList } from "@/src/components/SkeletonCard";
import type { EventWithDetails } from "@cyh/shared";

function buildGoogleCalendarUrl(event: EventWithDetails): string {
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : new Date(start.getTime() + 3600000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ...(event.venueName ? { location: [event.venueName, event.address].filter(Boolean).join(", ") } : {}),
    ...(event.description ? { details: event.description.slice(0, 500) } : {}),
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const content = (
    <View style={infoStyles.row}>
      <View style={[infoStyles.iconContainer, { backgroundColor: hexToRgba(theme.tint, 0.1) }]}>
        <Ionicons name={icon} size={18} color={theme.tint} />
      </View>
      <View style={infoStyles.textContainer}>
        <Text style={[infoStyles.label, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: theme.text }, onPress && { color: theme.tint }]}>
          {value}
        </Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={`${label}: ${value}`}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    marginBottom: 1,
  },
  value: {
    ...typography.body,
    fontWeight: "500",
  },
});

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
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

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <SkeletonList count={1} />
        </View>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ title: "Event" }} />
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            {error || "Event not found"}
          </Text>
        </View>
      </>
    );
  }

  const startDate = new Date(event.startAt);
  const eventColor = resolveSolidColor(event);

  const imageUri = event.imageUrl
    ? event.imageUrl.startsWith("http")
      ? event.imageUrl
      : `https://casperevents.org${event.imageUrl}`
    : null;

  const dateStr = format(startDate, "EEEE, MMMM d, yyyy");
  const timeStr = event.allDay
    ? "All day"
    : event.endAt
      ? `${format(startDate, "h:mm a")} – ${format(new Date(event.endAt), "h:mm a")}`
      : format(startDate, "h:mm a");

  const venueLine = [event.venueName, event.address].filter(Boolean).join(", ");

  const handleShare = () => {
    Share.share({
      title: event.title,
      message: `${event.title}\n${dateStr} at ${timeStr}\nhttps://casperevents.org/events/${event.id}`,
      url: `https://casperevents.org/events/${event.id}`,
    });
  };

  const handleAddToCalendar = () => {
    Linking.openURL(buildGoogleCalendarUrl(event));
  };

  const handleOpenMap = () => {
    const q = encodeURIComponent(venueLine);
    const url = Platform.select({
      ios: `maps:?q=${q}`,
      default: `https://maps.google.com/?q=${q}`,
    });
    Linking.openURL(url);
  };

  const sponsorsByLevel = event.sponsors?.reduce(
    (acc, s) => {
      (acc[s.level] = acc[s.level] || []).push(s);
      return acc;
    },
    {} as Record<string, typeof event.sponsors>
  );

  return (
    <>
      <Stack.Screen options={{ title: "", headerTransparent: imageUri ? true : false }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {imageUri ? (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.heroGradient}
            />
          </View>
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: hexToRgba(eventColor, 0.15) }]}>
            <Ionicons name="calendar" size={60} color={hexToRgba(eventColor, 0.3)} />
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {event.categories && event.categories.length > 0 && (
            <View style={styles.tagRow}>
              {event.categories.map((cat) => {
                const catColor = cat.color || colors.primary[600];
                return (
                  <View
                    key={cat.id}
                    style={[styles.tag, { backgroundColor: hexToRgba(catColor, 0.1) }]}
                  >
                    <Text style={[styles.tagText, { color: catColor }]}>{cat.name}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={[styles.title, { color: theme.text }]}>{event.title}</Text>
          {event.subtitle && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{event.subtitle}</Text>
          )}

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <InfoRow icon="calendar-outline" label="Date & Time" value={`${dateStr}\n${timeStr}`} />

          {(event as any).recurrenceRule && (
            <View style={styles.recurrenceRow}>
              <Ionicons name="repeat" size={14} color={theme.textSecondary} />
              <Text style={[styles.recurrenceText, { color: theme.textSecondary }]}>
                Repeats: {(event as any).recurrenceRule}
              </Text>
            </View>
          )}

          {venueLine && !event.isOnline && (
            <>
              <InfoRow
                icon="location-outline"
                label="Location"
                value={venueLine}
                onPress={handleOpenMap}
              />
              <Pressable
                style={styles.directionsBtn}
                onPress={handleOpenMap}
                accessibilityLabel="Get directions"
                accessibilityRole="link"
              >
                <Ionicons name="navigate-outline" size={16} color={colors.primary[600]} />
                <Text style={styles.directionsBtnText}>Get Directions</Text>
              </Pressable>
            </>
          )}

          {event.isOnline && (
            <InfoRow icon="globe-outline" label="Location" value="Online event" />
          )}

          {event.cost && (
            <InfoRow icon="pricetag-outline" label="Cost" value={event.cost} />
          )}

          {event.organization && (
            <Link href={`/organizations/${event.organization.slug}`} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`By ${event.organization.name}`}>
                <View style={infoStyles.row}>
                  <View style={[infoStyles.iconContainer, { backgroundColor: hexToRgba(theme.tint, 0.1) }]}>
                    {event.organization.logoUrl ? (
                      <Image
                        source={{ uri: event.organization.logoUrl }}
                        style={styles.orgLogoSmall}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={{ color: theme.tint, fontWeight: "700", fontSize: 16 }}>
                        {event.organization.name.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <View style={infoStyles.textContainer}>
                    <Text style={[infoStyles.label, { color: theme.textSecondary }]}>Organizer</Text>
                    <Text style={[infoStyles.value, { color: theme.tint }]}>
                      {event.organization.name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                </View>
              </Pressable>
            </Link>
          )}

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionBtn, { backgroundColor: theme.surfaceSecondary }]} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={theme.tint} />
              <Text style={[styles.actionText, { color: theme.tint }]}>Share</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: theme.surfaceSecondary }]} onPress={handleAddToCalendar}>
              <Ionicons name="add-circle-outline" size={20} color={theme.tint} />
              <Text style={[styles.actionText, { color: theme.tint }]}>Add to Calendar</Text>
            </Pressable>
          </View>

          {(event.ticketUrl || (event.isOnline && event.onlineEventUrl)) && (
            <View style={styles.ctaSection}>
              {event.ticketUrl && (
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: colors.primary[600] }]}
                  onPress={() => Linking.openURL(event.ticketUrl!)}
                  accessibilityLabel="Get tickets"
                  accessibilityRole="link"
                >
                  <Ionicons name="ticket-outline" size={20} color="#fff" />
                  <Text style={styles.primaryBtnText}>Get Tickets</Text>
                </Pressable>
              )}
              {event.isOnline && event.onlineEventUrl && (
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: colors.primary[600] }]}
                  onPress={() => Linking.openURL(event.onlineEventUrl!)}
                  accessibilityLabel="Join online event"
                  accessibilityRole="link"
                >
                  <Ionicons name="videocam-outline" size={20} color="#fff" />
                  <Text style={styles.primaryBtnText}>Join Online</Text>
                </Pressable>
              )}
            </View>
          )}

          {event.externalUrl && (
            <Pressable
              style={[styles.externalLink, { borderColor: theme.border }]}
              onPress={() => Linking.openURL(event.externalUrl!)}
              accessibilityRole="link"
            >
              <Ionicons name="open-outline" size={18} color={theme.tint} />
              <Text style={[styles.externalLinkText, { color: theme.tint }]}>
                {event.externalUrlText || "More Info"}
              </Text>
            </Pressable>
          )}
        </View>

        {event.description && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
            <Text style={[styles.description, { color: theme.text }]}>
              {event.description}
            </Text>
          </View>
        )}

        {/* Inline map */}
        {event.latitude != null && event.longitude != null && (
          <View style={[styles.card, { backgroundColor: theme.surface, overflow: "hidden" }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                onPress={handleOpenMap}
              >
                <Marker
                  coordinate={{
                    latitude: event.latitude,
                    longitude: event.longitude,
                  }}
                  title={event.venueName || event.title}
                  description={event.address || undefined}
                />
              </MapView>
            </View>
            {venueLine ? (
              <Pressable style={styles.mapFooter} onPress={handleOpenMap}>
                <View style={styles.mapFooterContent}>
                  <Ionicons name="location" size={16} color={colors.primary[600]} />
                  <View style={{ flex: 1 }}>
                    {event.venueName && (
                      <Text style={[styles.mapVenueName, { color: theme.text }]}>
                        {event.venueName}
                      </Text>
                    )}
                    {event.address && (
                      <Text style={[styles.mapAddress, { color: theme.textSecondary }]}>
                        {event.address}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="open-outline" size={16} color={colors.primary[600]} />
                </View>
              </Pressable>
            ) : null}
          </View>
        )}

        {sponsorsByLevel && Object.keys(sponsorsByLevel).length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sponsors</Text>
            {(["presenting", "gold", "silver", "bronze", "community"] as const).map(
              (level) => {
                const sponsors = sponsorsByLevel[level];
                if (!sponsors?.length) return null;
                return (
                  <View key={level} style={styles.sponsorGroup}>
                    <Text style={[styles.sponsorLevel, { color: theme.textSecondary }]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                    <View style={styles.sponsorRow}>
                      {sponsors.map((s) => (
                        <Pressable
                          key={s.id}
                          onPress={() => s.websiteUrl && Linking.openURL(s.websiteUrl)}
                          style={styles.sponsorItem}
                          disabled={!s.websiteUrl}
                        >
                          {s.logoUrl ? (
                            <Image
                              source={{ uri: s.logoUrl }}
                              style={styles.sponsorLogo}
                              contentFit="contain"
                            />
                          ) : (
                            <Text style={[styles.sponsorName, { color: theme.text }]}>
                              {s.name}
                            </Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}
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
  heroContainer: {
    position: "relative",
    width: "100%",
    height: 260,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroPlaceholder: {
    width: "100%",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  tagText: {
    ...typography.caption,
    fontWeight: "600",
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  actionText: {
    ...typography.callout,
    fontWeight: "600",
  },
  ctaSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  primaryBtnText: {
    color: "#fff",
    ...typography.body,
    fontWeight: "700",
  },
  externalLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  externalLinkText: {
    ...typography.callout,
    fontWeight: "600",
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    lineHeight: 24,
  },
  orgLogoSmall: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
  },
  sponsorGroup: {
    marginBottom: spacing.lg,
  },
  sponsorLevel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  sponsorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  sponsorItem: {
    alignItems: "center",
  },
  sponsorLogo: {
    width: 80,
    height: 40,
  },
  sponsorName: {
    ...typography.callout,
    fontWeight: "500",
  },
  recurrenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 36 + spacing.md,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  recurrenceText: {
    ...typography.caption,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 36 + spacing.md,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  directionsBtnText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.primary[600],
  },
  mapContainer: {
    height: 200,
    borderRadius: radii.md,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapFooter: {
    paddingTop: spacing.sm,
  },
  mapFooterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  mapVenueName: {
    ...typography.callout,
    fontWeight: "600",
  },
  mapAddress: {
    ...typography.caption,
    marginTop: 1,
  },
});
