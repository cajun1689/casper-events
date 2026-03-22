import { useState, useEffect } from "react";
import {
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { Text, View } from "@/components/Themed";
import { organizationsApi } from "@/src/lib/api";
import type { OrganizationPublic } from "@cyh/shared";

function OrgRow({ org }: { org: OrganizationPublic }) {
  return (
    <Link href={`/organizations/${org.slug}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.orgRow, pressed && styles.orgRowPressed]}
        accessibilityLabel={`${org.name} organization`}
        accessibilityRole="link"
      >
        <Text style={styles.orgName}>{org.name}</Text>
        {org.description ? (
          <Text style={styles.orgDesc} numberOfLines={2}>
            {org.description}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

export default function OrgsScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={orgs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrgRow org={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No organizations found.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  orgRow: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  orgRowPressed: {
    opacity: 0.7,
  },
  orgName: {
    fontSize: 16,
    fontWeight: "600",
  },
  orgDesc: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 4,
  },
  empty: { padding: 32, alignItems: "center" },
  error: { padding: 12, backgroundColor: "#fee" },
  errorText: { color: "#c00" },
});
