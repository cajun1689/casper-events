import { useMemo } from "react";
import { View, Text, Image, Pressable, SectionList, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import type { EventWithDetails } from "@cyh/shared";
import {
  getTextColorForPosterBackground,
  isPosterGradient,
  getFirstHexInGradient,
  extractPosterGradientColors,
  resolvePosterEventColor,
} from "@cyh/shared";
import { Colors } from "@/lib/constants";

interface Props {
  events: EventWithDetails[];
}

/**
 * Solid #RRGGBB for a flat card background.
 * For gradients we only use this when not rendering LinearGradient (should not happen if gradient parses).
 */
function solidHexForContrast(raw: string): string {
  const base = isPosterGradient(raw) ? getFirstHexInGradient(raw) : raw;
  let h = base.trim();
  if (!h.startsWith("#")) {
    const m = h.match(/#[0-9a-fA-F]{3,6}/);
    h = m ? m[0] : "#4f46e5";
  }
  const n = h.replace("#", "");
  if (n.length === 3) {
    return `#${n[0]}${n[0]}${n[1]}${n[1]}${n[2]}${n[2]}`.toLowerCase();
  }
  if (n.length === 6 && /^[0-9a-fA-F]{6}$/i.test(n)) {
    return `#${n.toLowerCase()}`;
  }
  return "#4f46e5";
}

/** Local calendar month — must match date badge (not UTC slice of ISO string). */
function monthKeyLocal(iso: string): string {
  return format(parseISO(iso), "yyyy-MM");
}

function posterImageUri(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `https://casperevents.org${url}`;
}

function PosterCard({ event }: { event: EventWithDetails }) {
  const router = useRouter();
  const rawColor = resolvePosterEventColor(event);
  const textColor = getTextColorForPosterBackground(rawColor);
  const gradient = isPosterGradient(rawColor);
  const [g1, g2] = extractPosterGradientColors(rawColor);
  const solidBg = solidHexForContrast(rawColor);
  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;
  const timeLabel = event.allDay
    ? "All day"
    : end
      ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
      : format(start, "h:mm a");

  const imageUri = posterImageUri(event.imageUrl);

  const inner = (
    <>
      <View style={styles.dateBadge}>
        <Text style={styles.dateBadgeMonth}>{format(start, "MMM")}</Text>
        <Text style={styles.dateBadgeDay}>{format(start, "d")}</Text>
        <Text style={styles.dateBadgeDow}>{format(start, "EEE")}</Text>
      </View>

      <View style={styles.cardContent}>
        {event.categories?.[0] && (
          <Text
            style={[styles.catLabel, { color: textColor, opacity: 0.8 }]}
            numberOfLines={1}
          >
            {event.categories[0].name}
          </Text>
        )}
        <Text
          style={[styles.cardTitle, { color: textColor }]}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        {event.subtitle && (
          <Text
            style={[styles.cardSubtitle, { color: textColor, opacity: 0.85 }]}
            numberOfLines={1}
          >
            {event.subtitle}
          </Text>
        )}
      </View>

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.cardImage}
          accessibilityIgnoresInvertColors
        />
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.footerText, { color: textColor }]}>
          • {timeLabel}
        </Text>
        {event.venueName && (
          <Text
            style={[styles.footerText, { color: textColor, opacity: 0.85 }]}
            numberOfLines={1}
          >
            📍 {event.venueName}
          </Text>
        )}
        {event.cost && (
          <Text
            style={[styles.footerText, { color: textColor, opacity: 0.75 }]}
          >
            • {event.cost}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <Pressable
      onPress={() => router.push(`/events/${event.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${format(start, "EEEE MMMM d")} ${timeLabel}`}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {gradient ? (
        <LinearGradient
          colors={[g1, g2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={[styles.card, { backgroundColor: solidBg }]}>{inner}</View>
      )}
    </Pressable>
  );
}

export function PosterView({ events }: Props) {
  const sections = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    const map = new Map<string, EventWithDetails[]>();
    for (const event of sorted) {
      const key = monthKeyLocal(event.startAt);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    const now = format(new Date(), "yyyy-MM");
    return Array.from(map.entries())
      .filter(([k]) => k >= now)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        title: format(
          new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1),
          "MMMM yyyy",
        ),
        data,
      }));
  }, [events]);

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No events found</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PosterCard event={item} />}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader} accessibilityRole="header">
          {section.title}
        </Text>
      )}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pressed: {
    opacity: 0.96,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  dateBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    width: 50,
    paddingVertical: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dateBadgeMonth: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dateBadgeDay: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    lineHeight: 24,
  },
  dateBadgeDow: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  cardContent: {
    paddingLeft: 70,
    paddingRight: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  catLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  cardImage: {
    width: "100%",
    height: 160,
    marginTop: 6,
  },
  cardFooter: {
    paddingLeft: 70,
    paddingRight: 14,
    paddingVertical: 10,
    gap: 2,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
