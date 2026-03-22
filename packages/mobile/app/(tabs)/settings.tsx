import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { organizationsApi, pushApi } from "@/src/lib/api";
import { getStoredPushToken, setStoredPushToken, clearStoredPushToken } from "@/src/lib/push-token-storage";
import type { OrganizationPublic } from "@cyh/shared";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function SettingsScreen() {
  const [orgs, setOrgs] = useState<OrganizationPublic[]>([]);
  const [subscribedOrgIds, setSubscribedOrgIds] = useState<Set<string>>(new Set());
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOrgs = useCallback(async () => {
    try {
      const res = await organizationsApi.list();
      setOrgs(res.data);
    } catch {
      // ignore
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    const token = await getStoredPushToken();
    setPushToken(token);
    if (token) {
      try {
        const { orgIds } = await pushApi.getOrgs(token);
        setSubscribedOrgIds(new Set(orgIds));
      } catch {
        setSubscribedOrgIds(new Set());
      }
    } else {
      setSubscribedOrgIds(new Set());
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadOrgs();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [loadOrgs]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const setupPush = async () => {
    if (!Device.isDevice) {
      Alert.alert(
        "Push notifications",
        "Push notifications are only available on physical devices."
      );
      return;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== "granted") {
      Alert.alert(
        "Permission required",
        "Enable notifications in Settings to get event reminders."
      );
      return;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      await setStoredPushToken(token);
      setPushToken(token);

      const platform = Platform.OS === "ios" ? "ios" : "android";
      await pushApi.register(token, platform);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to setup push notifications"
      );
    }
  };

  const toggleOrg = async (orgId: string) => {
    if (!pushToken) {
      Alert.alert(
        "Setup required",
        "Enable push notifications first, then select organizations."
      );
      return;
    }

    setSaving(true);
    const next = new Set(subscribedOrgIds);
    if (next.has(orgId)) {
      next.delete(orgId);
    } else {
      next.add(orgId);
    }
    setSubscribedOrgIds(next);

    try {
      await pushApi.setOrgs(pushToken, [...next]);
    } catch (e) {
      setSubscribedOrgIds(subscribedOrgIds);
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to update subscriptions"
      );
    } finally {
      setSaving(false);
    }
  };

  const disablePush = async () => {
    if (!pushToken) return;
    try {
      await pushApi.unregister(pushToken);
      await clearStoredPushToken();
      setPushToken(null);
      setSubscribedOrgIds(new Set());
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push notifications</Text>
      <Text style={styles.desc}>
        Get reminders 1.5 hours before events from organizations you follow.
      </Text>

      {!pushToken ? (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={setupPush}
          accessibilityLabel="Enable push notifications"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Enable push notifications</Text>
        </Pressable>
      ) : (
        <>
          <Pressable
            style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]}
            onPress={disablePush}
            accessibilityLabel="Disable push notifications"
            accessibilityRole="button"
          >
            <Text style={styles.buttonSecondaryText}>Disable push notifications</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Notify me about events from:</Text>
          {saving && (
            <View style={styles.saving}>
              <ActivityIndicator size="small" />
            </View>
          )}
          <FlatList
            data={orgs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.orgRow,
                  pressed && styles.orgRowPressed,
                  subscribedOrgIds.has(item.id) && styles.orgRowSelected,
                ]}
                onPress={() => toggleOrg(item.id)}
                disabled={saving}
                accessibilityLabel={`${item.name}, ${subscribedOrgIds.has(item.id) ? "subscribed" : "not subscribed"}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: subscribedOrgIds.has(item.id) }}
              >
                <Text
                  style={[
                    styles.orgName,
                    subscribedOrgIds.has(item.id) && styles.orgNameSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </>
      )}

      <Text style={styles.hint}>
        City filter is set on the Events tab.
      </Text>

      <Text style={styles.sectionTitle}>More</Text>
      <Link href="/about" asChild>
        <Pressable
          style={styles.linkRow}
          accessibilityLabel="About Wyoming Events Calendar"
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>About</Text>
        </Pressable>
      </Link>
      <Link href="/updates" asChild>
        <Pressable
          style={styles.linkRow}
          accessibilityLabel="Updates"
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>Updates</Text>
        </Pressable>
      </Link>
      <Link href="/privacy" asChild>
        <Pressable
          style={styles.linkRow}
          accessibilityLabel="Privacy Policy"
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Pressable>
      </Link>
      <Link href="/terms" asChild>
        <Pressable
          style={styles.linkRow}
          accessibilityLabel="Terms of Service"
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>Terms of Service</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  desc: { fontSize: 14, opacity: 0.8, marginBottom: 16 },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonSecondary: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  buttonSecondaryText: { color: "#666" },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonPressed: { opacity: 0.8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  saving: { marginBottom: 8 },
  orgRow: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  orgRowPressed: { opacity: 0.7 },
  orgRowSelected: { backgroundColor: "#eff6ff" },
  orgName: { fontSize: 16 },
  orgNameSelected: { fontWeight: "600" },
  hint: { fontSize: 12, opacity: 0.6, marginTop: 24 },
  linkRow: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  linkText: { fontSize: 16, color: "#2563eb" },
});
