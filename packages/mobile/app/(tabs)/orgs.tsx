import { useState, useEffect } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { spacing, typography } from "@/src/theme";
import { organizationsApi } from "@/src/lib/api";
import { OrgCard, OrgCardSkeleton } from "@/src/components/OrgCard";
import type { OrganizationPublic } from "@cyh/shared";

export default function OrgsScreen() {
  const theme = useAppTheme();
  const [orgs, setOrgs] = useState<OrganizationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setError(null);
    try {
      const res = await organizationsApi.list();
      setOrgs(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load organizations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchOrgs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchOrgs();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.skeletonList}>
          {Array.from({ length: 6 }).map((_, i) => (
            <OrgCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={orgs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrgCard org={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No organizations found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Check back later for community organizations
            </Text>
          </View>
        }
        ListHeaderComponent={
          error ? (
            <View style={[styles.errorBanner, { backgroundColor: "rgba(239,68,68,0.08)" }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.tint}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  skeletonList: {
    paddingTop: spacing.lg,
  },
  empty: {
    padding: spacing["4xl"],
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.headline,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.callout,
    textAlign: "center",
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: "#dc2626",
    ...typography.callout,
  },
});
