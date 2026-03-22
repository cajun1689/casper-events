import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { colors, spacing, radii, typography } from "@/src/theme";
import { resolveSolidColor, hexToRgba } from "@/src/lib/event-colors";
import type { EventWithDetails } from "@cyh/shared";

interface EventRowProps {
  event: EventWithDetails;
  showDate?: boolean;
}

export function EventRow({ event, showDate = false }: EventRowProps) {
  const theme = useAppTheme();
  const startDate = new Date(event.startAt);
  const eventColor = resolveSolidColor(event);

  const timeStr = event.allDay ? "All day" : format(startDate, "h:mm a");

  const imageUri = event.imageUrl
    ? event.imageUrl.startsWith("http")
      ? event.imageUrl
      : `https://casperevents.org${event.imageUrl}`
    : null;

  return (
    <Link href={`/events/${event.id}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.cardBackground },
          pressed && styles.pressed,
        ]}
        accessibilityLabel={`${event.title}, ${timeStr} at ${event.venueName || "TBD"}`}
        accessibilityRole="link"
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.thumbnail}
            contentFit="cover"
            recyclingKey={event.id}
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: hexToRgba(eventColor, 0.12) }]}>
            <Ionicons name="calendar" size={18} color={hexToRgba(eventColor, 0.5)} />
          </View>
        )}

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {event.featured && (
              <Text style={{ color: colors.amber[500] }}>★ </Text>
            )}
            {event.title}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
            {showDate && `${format(startDate, "EEE, MMM d")} · `}
            {timeStr}
            {event.venueName ? ` · ${event.venueName}` : ""}
          </Text>
          {event.categories && event.categories.length > 0 && (
            <View style={styles.tagRow}>
              {event.categories.slice(0, 2).map((cat) => (
                <View
                  key={cat.id}
                  style={[styles.tag, { backgroundColor: hexToRgba(cat.color || colors.primary[600], 0.1) }]}
                >
                  <Text style={[styles.tagText, { color: cat.color || colors.primary[600] }]}>
                    {cat.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.body,
    fontWeight: "600",
  },
  meta: {
    ...typography.caption,
  },
  tagRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
