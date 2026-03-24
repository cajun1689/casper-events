import { StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { format, parseISO } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/theme";
import {
  resolveColor,
  getTextColor,
  isGradient,
  extractGradientColors,
} from "@/lib/event-colors";
import type { EventWithDetails } from "@cyh/shared";

function cleanDescription(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/_{2,}/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sponsorHeight(level?: string): number {
  switch (level) {
    case "presenting": return 32;
    case "gold": return 28;
    case "silver": return 24;
    default: return 20;
  }
}

function sponsorWidth(level?: string): number {
  switch (level) {
    case "presenting": return 80;
    case "gold": return 70;
    case "silver": return 55;
    default: return 48;
  }
}

interface PosterCardProps {
  event: EventWithDetails;
}

const FALLBACK_BG = "#4f46e5";

export function PosterCard({ event }: PosterCardProps) {
  const theme = useAppTheme();
  const bgColor = resolveColor(event) || FALLBACK_BG;
  const textColor = getTextColor(bgColor) || "#ffffff";
  const gradient = isGradient(bgColor);
  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;

  const timeLabel = event.allDay
    ? "All day"
    : end
      ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
      : format(start, "h:mm a");

  const primaryCat = event.categories?.[0];
  const sponsors = event.sponsors ?? [];

  const imageUri = event.imageUrl
    ? event.imageUrl.startsWith("http")
      ? event.imageUrl
      : `https://casperevents.org${event.imageUrl}`
    : null;

  const snippet =
    event.snippet || (event.description ? cleanDescription(event.description) : null);

  const cardContent = (
    <>
      {/* Date badge */}
      <View style={styles.dateBadge}>
        <Text style={styles.dateBadgeMonth}>
          {format(start, "MMM").toUpperCase()}
        </Text>
        <Text style={styles.dateBadgeDay}>{format(start, "d")}</Text>
        <Text style={styles.dateBadgeDow}>{format(start, "EEE")}</Text>
      </View>

      {/* Header content */}
      <View style={styles.headerContent}>
        {primaryCat && (
          <Text
            style={[styles.categoryLabel, { color: textColor, opacity: 0.85 }]}
          >
            {primaryCat.name.toUpperCase()}
          </Text>
        )}
        <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
          {event.title}
        </Text>
        {event.subtitle && (
          <Text
            style={[styles.subtitle, { color: textColor, opacity: 0.9 }]}
            numberOfLines={2}
          >
            {event.subtitle}
          </Text>
        )}
        {snippet && (
          <Text
            style={[styles.snippet, { color: textColor, opacity: 0.75 }]}
            numberOfLines={2}
          >
            {snippet}
          </Text>
        )}
      </View>

      {/* Event image with glossy overlay */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            recyclingKey={event.id}
          />
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.15)",
              "transparent",
              "rgba(0,0,0,0.06)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Sponsor logos */}
      {sponsors.length > 0 && (
        <View style={styles.sponsorRow}>
          {sponsors.slice(0, 4).map((s) => {
            const h = sponsorHeight((s as any).level);
            const w = sponsorWidth((s as any).level);
            return (
              <View key={s.id} style={styles.sponsorBadge}>
                {s.logoUrl ? (
                  <Image
                    source={{ uri: s.logoUrl }}
                    style={{ height: h, width: w }}
                    contentFit="contain"
                  />
                ) : (
                  <Text
                    style={[
                      styles.sponsorName,
                      { color: textColor, opacity: 0.85 },
                    ]}
                  >
                    {s.name}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Time and location */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: textColor, opacity: 0.95 }]}>
          • {timeLabel}
        </Text>
        {(event.venueName || event.address) && (
          <View style={styles.footerRow}>
            <Ionicons
              name="location"
              size={12}
              color={textColor}
              style={{ opacity: 0.9, marginTop: 1 }}
            />
            <Text
              style={[styles.footerText, { color: textColor, opacity: 0.95 }]}
              numberOfLines={2}
            >
              {event.venueName}
              {event.venueName && event.address ? (
                <Text style={{ opacity: 0.7 }}> · </Text>
              ) : null}
              {event.address && (
                <Text style={{ opacity: 0.8 }}>{event.address}</Text>
              )}
            </Text>
          </View>
        )}
        {event.cost && (
          <Text
            style={[styles.footerText, { color: textColor, opacity: 0.8 }]}
          >
            • {event.cost}
          </Text>
        )}
      </View>

      {/* CTA button for external link */}
      {(event as any).externalUrl && (
        <View style={styles.ctaContainer}>
          <Pressable
            style={styles.ctaButton}
            onPress={(e) => {
              Linking.openURL((event as any).externalUrl);
            }}
            accessibilityLabel={
              (event as any).externalUrlText || "Learn More"
            }
            accessibilityRole="link"
          >
            <Ionicons name="open-outline" size={14} color={colors.gray[900]} />
            <Text style={styles.ctaText}>
              {(event as any).externalUrlText || "Learn More"}
            </Text>
          </Pressable>
          {(event as any).externalUrlCaption && (
            <Text
              style={[styles.ctaCaption, { color: textColor, opacity: 0.9 }]}
            >
              {(event as any).externalUrlCaption}
            </Text>
          )}
        </View>
      )}
    </>
  );

  if (gradient) {
    const gradientColors = extractGradientColors(bgColor);
    return (
      <Link href={`/events/${event.id}`} asChild>
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          accessibilityLabel={`${event.title}, ${format(start, "EEEE, MMMM d")}`}
          accessibilityRole="link"
        >
          <LinearGradient
            colors={gradientColors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, shadows.lg]}
          >
            {cardContent}
          </LinearGradient>
        </Pressable>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.id}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          shadows.lg,
          { backgroundColor: bgColor },
          pressed && styles.pressed,
        ]}
        accessibilityLabel={`${event.title}, ${format(start, "EEEE, MMMM d")}`}
        accessibilityRole="link"
      >
        {cardContent}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
    minHeight: 180,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  dateBadge: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 56,
    ...shadows.lg,
  },
  dateBadgeMonth: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.gray[500],
  },
  dateBadgeDay: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
    color: colors.gray[900],
  },
  dateBadgeDow: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.gray[400],
  },
  headerContent: {
    paddingLeft: 80,
    paddingRight: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    minHeight: 72,
  },
  categoryLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 2,
  },
  snippet: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    marginTop: 4,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  sponsorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sponsorBadge: {
    borderRadius: radii.md,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sponsorName: {
    fontSize: 10,
    fontWeight: "700",
  },
  footer: {
    marginTop: "auto",
    paddingLeft: 80,
    paddingRight: spacing.lg,
    paddingVertical: spacing.md,
    gap: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  ctaContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...shadows.sm,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.gray[900],
  },
  ctaCaption: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
});
