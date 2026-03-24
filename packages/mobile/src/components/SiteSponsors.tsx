import { useState, useEffect } from "react";
import { View, Text, Image, Pressable, Linking, StyleSheet } from "react-native";
import { api } from "@/lib/api";
import { Colors } from "@/lib/constants";

interface SiteSponsor {
  name: string;
  logoUrl: string;
  url: string;
  level: "presenting" | "gold" | "silver" | "bronze" | "community";
  sortOrder: number;
}

const LEVEL_ORDER = ["presenting", "gold", "silver", "bronze", "community"];
const LOGO_SIZES: Record<string, { width: number; height: number }> = {
  presenting: { width: 140, height: 50 },
  gold: { width: 110, height: 40 },
  silver: { width: 80, height: 32 },
  bronze: { width: 60, height: 24 },
  community: { width: 48, height: 20 },
};

export function SiteSponsors() {
  const [sponsors, setSponsors] = useState<SiteSponsor[]>([]);

  useEffect(() => {
    api
      .get<{ data: SiteSponsor[] }>("/site-sponsors")
      .then((r) => setSponsors(r.data))
      .catch(() => {});
  }, []);

  if (sponsors.length === 0) return null;

  const grouped = LEVEL_ORDER.map((level) => ({
    level,
    items: sponsors
      .filter((s) => s.level === level)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((g) => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading} accessibilityRole="header">
        Our Sponsors
      </Text>
      {grouped.map(({ level, items }) => {
        const size = LOGO_SIZES[level] ?? LOGO_SIZES.community;
        return (
          <View key={level} style={styles.row}>
            {items.map((s, i) => {
              const content = s.logoUrl ? (
                <Image
                  source={{ uri: s.logoUrl }}
                  style={{ width: size.width, height: size.height }}
                  resizeMode="contain"
                  accessibilityLabel={s.name}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Text style={styles.sponsorName}>{s.name}</Text>
              );
              return s.url ? (
                <Pressable
                  key={i}
                  onPress={() => Linking.openURL(s.url)}
                  accessibilityRole="link"
                  accessibilityLabel={`Sponsor: ${s.name}`}
                >
                  {content}
                </Pressable>
              ) : (
                <View key={i}>{content}</View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heading: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  sponsorName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
});
