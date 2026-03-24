import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/theme";
import { resolveSolidColor, hexToRgba } from "@/lib/event-colors";
import type { EventWithDetails } from "@cyh/shared";

interface EventCardProps {
  event: EventWithDetails;
}

export function EventCard({ event }: EventCardProps) {
  const theme = useAppTheme();
  const startDate = new Date(event.startAt);
  const monthAbbr = format(startDate, "MMM").toUpperCase();
  const dayNum = format(startDate, "d");

  const timeStr = event.allDay
    ? "All day"
    : format(startDate, "h:mm a");

  const imageUri = event.imageUrl
    ? event.imageUrl.startsWith("http")
      ? event.imageUrl
      : `https://casperevents.org${event.imageUrl}`
    : null;

  const eventColor = resolveSolidColor(event);

  return (
    <Link href={`/events/${event.id}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          shadows.md,
          { backgroundColor: theme.cardBackground },
          pressed && styles.pressed,
        ]}
        accessibilityLabel={`${event.title}, ${format(startDate, "EEEE, MMMM d")} at ${event.venueName || "TBD"}`}
        accessibilityRole="link"
      >
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              recyclingKey={event.id}
            />
          ) : (
            <View
              style={[styles.imagePlaceholder, { backgroundColor: hexToRgba(eventColor, 0.15) }]}
            >
              <Ionicons name="calendar" size={40} color={hexToRgba(eventColor, 0.4)} />
            </View>
          )}
          <View style={[styles.dateBadge, { backgroundColor: theme.surface }]}>
            <Text style={[styles.dateBadgeMonth, { color: colors.primary[600] }]}>
              {monthAbbr}
            </Text>
            <Text style={[styles.dateBadgeDay, { color: theme.text }]}>
              {dayNum}
            </Text>
          </View>
          {event.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {timeStr}
            </Text>
            {event.venueName && (
              <>
                <Text style={[styles.metaDot, { color: theme.textTertiary }]}>·</Text>
                <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                <Text
                  style={[styles.metaText, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {event.venueName}
                </Text>
              </>
            )}
          </View>

          {event.categories && event.categories.length > 0 && (
            <View style={styles.tagRow}>
              {event.categories.slice(0, 3).map((cat) => {
                const catColor = cat.color || colors.primary[600];
                return (
                  <View
                    key={cat.id}
                    style={[styles.tag, { backgroundColor: hexToRgba(catColor, 0.1) }]}
                  >
                    <Text style={[styles.tagText, { color: catColor }]}>
                      {cat.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {event.organization && (
            <View style={styles.orgRow}>
              {event.organization.logoUrl ? (
                <Image
                  source={{ uri: event.organization.logoUrl }}
                  style={styles.orgLogo}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.orgInitial, { backgroundColor: hexToRgba(eventColor, 0.15) }]}>
                  <Text style={[styles.orgInitialText, { color: eventColor }]}>
                    {event.organization.name.charAt(0)}
                  </Text>
                </View>
              )}
              <Text
                style={[styles.orgName, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {event.organization.name}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: "hidden",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 16 / 9,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dateBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
    minWidth: 44,
    ...shadows.md,
  },
  dateBadgeMonth: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  dateBadgeDay: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
  },
  featuredBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.amber[500],
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 3,
  },
  featuredText: {
    ...typography.caption,
    fontWeight: "700",
    color: "#fff",
    fontSize: 10,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },
  metaText: {
    ...typography.caption,
  },
  metaDot: {
    ...typography.caption,
    marginHorizontal: 2,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  tagText: {
    ...typography.caption,
    fontWeight: "600",
    fontSize: 11,
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orgLogo: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
  },
  orgInitial: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
  },
  orgInitialText: {
    fontSize: 11,
    fontWeight: "700",
  },
  orgName: {
    ...typography.caption,
    flex: 1,
  },
});
