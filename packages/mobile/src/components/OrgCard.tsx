import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/theme";
import type { OrganizationPublic } from "@cyh/shared";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface OrgCardProps {
  org: OrganizationPublic;
}

export function OrgCard({ org }: OrgCardProps) {
  const theme = useAppTheme();

  return (
    <Link href={`/organizations/${org.slug}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          shadows.sm,
          { backgroundColor: theme.cardBackground },
          pressed && styles.pressed,
        ]}
        accessibilityLabel={`${org.name} organization`}
        accessibilityRole="link"
      >
        <View style={styles.topRow}>
          {org.logoUrl ? (
            <Image
              source={{ uri: org.logoUrl }}
              style={styles.logo}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.initialCircle, { backgroundColor: hexToRgba(colors.primary[600], 0.1) }]}>
              <Text style={[styles.initialText, { color: colors.primary[600] }]}>
                {org.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.titleContainer}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {org.name}
            </Text>
            {org.description && (
              <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
                {org.description}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
        </View>

        {(org.website || org.email) && (
          <View style={styles.contactRow}>
            {org.website && (
              <View style={styles.contactItem}>
                <Ionicons name="globe-outline" size={14} color={theme.textTertiary} />
                <Text style={[styles.contactText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {org.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </Text>
              </View>
            )}
            {org.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={14} color={theme.textTertiary} />
                <Text style={[styles.contactText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {org.email}
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

export function OrgCardSkeleton() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, shadows.sm, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.topRow}>
        <View style={[styles.initialCircle, { backgroundColor: theme.skeleton }]} />
        <View style={styles.titleContainer}>
          <View style={{ width: "70%", height: 16, borderRadius: 4, backgroundColor: theme.skeleton, marginBottom: 6 }} />
          <View style={{ width: "90%", height: 12, borderRadius: 4, backgroundColor: theme.skeleton }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
  },
  initialCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  initialText: {
    fontSize: 20,
    fontWeight: "700",
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    ...typography.headline,
    marginBottom: 2,
  },
  description: {
    ...typography.caption,
    lineHeight: 18,
  },
  contactRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
    gap: spacing.sm,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  contactText: {
    ...typography.caption,
    flex: 1,
  },
});
