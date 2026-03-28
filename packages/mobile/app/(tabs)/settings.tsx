import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/src/theme";
import { organizationsApi, pushApi } from "@/src/lib/api";
import {
  getStoredPushToken,
  setStoredPushToken,
  clearStoredPushToken,
} from "@/src/lib/push-token-storage";
import { getSelectedCity, setSelectedCity } from "@/src/lib/city-storage";
import { getDefaultViewMode, setDefaultViewMode } from "@/src/lib/view-storage";
import { getFilteredOrgIds, setFilteredOrgIds } from "@/src/lib/org-filter-storage";
import { ALL_WYOMING_VALUE, WYOMING_CITIES } from "@/src/lib/wyoming-cities";
import { clearBreadcrumbs, getBreadcrumbDump, logBreadcrumb } from "@/src/lib/crash-logger";
import type { ViewMode } from "@/src/components/ViewToggle";
import type { OrganizationPublic } from "@cyh/shared";

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  cards: "Cards",
  list: "List",
  poster: "Poster",
  calendar: "Calendar",
  map: "Map",
};

const VIEW_MODE_OPTIONS: ViewMode[] = ["cards", "list", "poster", "calendar", "map"];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function SectionHeader({ title }: { title: string }) {
  const theme = useAppTheme();
  return (
    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
      {title}
    </Text>
  );
}

function SettingsRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const theme = useAppTheme();
  const content = (
    <View style={[styles.row, { backgroundColor: theme.surface }]}>
      <View style={[styles.rowIconContainer, { backgroundColor: `${iconColor || theme.tint}18` }]}>
        <Ionicons name={icon} size={18} color={iconColor || theme.tint} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        {value && (
          <Text style={[styles.rowValue, { color: theme.textSecondary }]} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {trailing || (onPress && <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />)}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
        accessibilityLabel={label}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const [orgs, setOrgs] = useState<OrganizationPublic[]>([]);
  const [subscribedOrgIds, setSubscribedOrgIds] = useState<Set<string>>(
    new Set()
  );
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cityDisplay, setCityDisplay] = useState<string>(ALL_WYOMING_VALUE);
  const [defaultView, setDefaultView] = useState<ViewMode>("cards");
  const [viewPickerOpen, setViewPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [filteredOrgIds, setFilteredOrgIdsState] = useState<Set<string>>(new Set());
  const [orgFilterOpen, setOrgFilterOpen] = useState(false);

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

  const loadCity = useCallback(async () => {
    const city = await getSelectedCity();
    setCityDisplay(city || ALL_WYOMING_VALUE);
  }, []);

  const loadViewMode = useCallback(async () => {
    const mode = await getDefaultViewMode();
    setDefaultView(mode);
  }, []);

  const loadOrgFilter = useCallback(async () => {
    const ids = await getFilteredOrgIds();
    setFilteredOrgIdsState(new Set(ids));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await Promise.all([loadOrgs(), loadCity(), loadViewMode(), loadOrgFilter()]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [loadOrgs, loadCity, loadViewMode, loadOrgFilter]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const setupPush = async () => {
    if (!Device.isDevice) {
      Alert.alert(
        "Push Notifications",
        "Push notifications are only available on physical devices."
      );
      return;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission Required",
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

  const toggleOrg = async (orgId: string) => {
    if (!pushToken) {
      Alert.alert(
        "Setup Required",
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

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const showDiagnostics = useCallback(async () => {
    const dump = await getBreadcrumbDump();
    logBreadcrumb("diagnostics-viewed", { length: dump.length });
    // eslint-disable-next-line no-console
    console.log(`[diag-dump] ${dump}`);
    Alert.alert(
      "Diagnostics captured",
      "Startup diagnostics were written to app logs as [diag-dump]. Include those logs with your crash report."
    );
  }, []);

  const resetDiagnostics = useCallback(async () => {
    await clearBreadcrumbs();
    logBreadcrumb("diagnostics-reset");
    Alert.alert("Diagnostics cleared", "Stored crash breadcrumbs were reset.");
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Notifications Section */}
      <SectionHeader title="NOTIFICATIONS" />
      <View style={[styles.group, shadows.sm, { backgroundColor: theme.surface }]}>
        <View style={styles.row}>
          <View style={[styles.rowIconContainer, { backgroundColor: `${colors.primary[600]}18` }]}>
            <Ionicons name="notifications" size={18} color={colors.primary[600]} />
          </View>
          <View style={styles.rowContent}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Push Notifications</Text>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
              Reminders 1.5 hours before events
            </Text>
          </View>
          <Switch
            value={!!pushToken}
            onValueChange={(val) => (val ? setupPush() : disablePush())}
            trackColor={{ false: theme.border, true: colors.primary[400] }}
            thumbColor={pushToken ? colors.primary[600] : theme.textTertiary}
          />
        </View>
      </View>

      {pushToken && orgs.length > 0 && (
        <>
          <SectionHeader title="NOTIFY ME ABOUT EVENTS FROM" />
          <View style={[styles.group, shadows.sm, { backgroundColor: theme.surface }]}>
            {orgs.map((org, index) => {
              const subscribed = subscribedOrgIds.has(org.id);
              return (
                <Pressable
                  key={org.id}
                  onPress={() => toggleOrg(org.id)}
                  disabled={saving}
                  style={({ pressed }) => pressed && { opacity: 0.7 }}
                  accessibilityLabel={`${org.name}, ${subscribed ? "subscribed" : "not subscribed"}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: subscribed }}
                >
                  <View
                    style={[
                      styles.orgRow,
                      index < orgs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderLight },
                    ]}
                  >
                    <Text style={[styles.orgName, { color: theme.text }]}>{org.name}</Text>
                    {subscribed && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary[600]} />
                    )}
                    {!subscribed && (
                      <View style={[styles.unchecked, { borderColor: theme.border }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* Preferences Section */}
      <SectionHeader title="PREFERENCES" />
      <View style={[styles.group, shadows.sm, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={() => { setCityPickerOpen(!cityPickerOpen); setViewPickerOpen(false); }}
          style={({ pressed }) => pressed && { opacity: 0.7 }}
          accessibilityLabel={`City filter: ${cityDisplay}`}
          accessibilityRole="button"
        >
          <View style={styles.row}>
            <View style={[styles.rowIconContainer, { backgroundColor: `${colors.amber[600]}18` }]}>
              <Ionicons name="location" size={18} color={colors.amber[600]} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>City Filter</Text>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]} numberOfLines={1}>
                {cityDisplay}
              </Text>
            </View>
            <Ionicons
              name={cityPickerOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textTertiary}
            />
          </View>
        </Pressable>
        {cityPickerOpen && (
          <ScrollView style={styles.cityPickerScroll} nestedScrollEnabled>
            {WYOMING_CITIES.map((city) => {
              const active = city === cityDisplay;
              return (
                <Pressable
                  key={city}
                  onPress={async () => {
                    setCityDisplay(city);
                    await setSelectedCity(city === ALL_WYOMING_VALUE ? null : city);
                    setCityPickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.viewPickerItem,
                    active && { backgroundColor: theme.surfaceSecondary },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.viewPickerText,
                      { color: theme.text },
                      active && { color: theme.tint, fontWeight: "600" },
                    ]}
                  >
                    {city}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={theme.tint} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
        <Pressable
          onPress={() => { setViewPickerOpen(!viewPickerOpen); setCityPickerOpen(false); }}
          style={({ pressed }) => pressed && { opacity: 0.7 }}
          accessibilityLabel={`Default view: ${VIEW_MODE_LABELS[defaultView]}`}
          accessibilityRole="button"
        >
          <View style={styles.row}>
            <View style={[styles.rowIconContainer, { backgroundColor: `${colors.primary[600]}18` }]}>
              <Ionicons name="grid-outline" size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Default View</Text>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
                {VIEW_MODE_LABELS[defaultView]}
              </Text>
            </View>
            <Ionicons
              name={viewPickerOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textTertiary}
            />
          </View>
        </Pressable>
        {viewPickerOpen && (
          <View style={styles.viewPickerContainer}>
            {VIEW_MODE_OPTIONS.map((mode) => {
              const active = mode === defaultView;
              return (
                <Pressable
                  key={mode}
                  onPress={async () => {
                    setDefaultView(mode);
                    await setDefaultViewMode(mode);
                    setViewPickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.viewPickerItem,
                    active && { backgroundColor: theme.surfaceSecondary },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.viewPickerText,
                      { color: theme.text },
                      active && { color: theme.tint, fontWeight: "600" },
                    ]}
                  >
                    {VIEW_MODE_LABELS[mode]}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={theme.tint} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <Text style={[styles.groupFooter, { color: theme.textTertiary }]}>
        City filter and default view are also changeable on the Events tab.
      </Text>

      {/* Organization Filter Section */}
      <SectionHeader title="SHOW EVENTS FROM" />
      <View style={[styles.group, shadows.sm, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={() => { setOrgFilterOpen(!orgFilterOpen); setCityPickerOpen(false); setViewPickerOpen(false); }}
          style={({ pressed }) => pressed && { opacity: 0.7 }}
          accessibilityLabel="Filter by organizations"
          accessibilityRole="button"
        >
          <View style={styles.row}>
            <View style={[styles.rowIconContainer, { backgroundColor: `${colors.primary[600]}18` }]}>
              <Ionicons name="business-outline" size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Organizations</Text>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]} numberOfLines={1}>
                {filteredOrgIds.size === 0 ? "All organizations" : `${filteredOrgIds.size} selected`}
              </Text>
            </View>
            <Ionicons
              name={orgFilterOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textTertiary}
            />
          </View>
        </Pressable>
        {orgFilterOpen && (
          <ScrollView style={styles.cityPickerScroll} nestedScrollEnabled>
            {/* "All" option */}
            <Pressable
              onPress={async () => {
                setFilteredOrgIdsState(new Set());
                await setFilteredOrgIds([]);
              }}
              style={({ pressed }) => [
                styles.viewPickerItem,
                filteredOrgIds.size === 0 && { backgroundColor: theme.surfaceSecondary },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text
                style={[
                  styles.viewPickerText,
                  { color: theme.text },
                  filteredOrgIds.size === 0 && { color: theme.tint, fontWeight: "600" },
                ]}
              >
                All Organizations
              </Text>
              {filteredOrgIds.size === 0 && (
                <Ionicons name="checkmark" size={18} color={theme.tint} />
              )}
            </Pressable>
            {/* Org rows filtered by city */}
            {orgs
              .filter((org) => {
                if (cityDisplay === ALL_WYOMING_VALUE) return true;
                return org.address?.toLowerCase().includes(cityDisplay.toLowerCase()) ?? false;
              })
              .map((org) => {
                const active = filteredOrgIds.has(org.id);
                return (
                  <Pressable
                    key={org.id}
                    onPress={async () => {
                      const next = new Set(filteredOrgIds);
                      if (active) {
                        next.delete(org.id);
                      } else {
                        next.add(org.id);
                      }
                      setFilteredOrgIdsState(next);
                      await setFilteredOrgIds([...next]);
                    }}
                    style={({ pressed }) => [
                      styles.viewPickerItem,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={[styles.viewPickerText, { color: theme.text }]}>
                      {org.name}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                    ) : (
                      <View style={[styles.unchecked, { borderColor: theme.border }]} />
                    )}
                  </Pressable>
                );
              })}
          </ScrollView>
        )}
      </View>
      <Text style={[styles.groupFooter, { color: theme.textTertiary }]}>
        {cityDisplay !== ALL_WYOMING_VALUE
          ? `Showing organizations in ${cityDisplay}. Select specific ones to filter events.`
          : "Select specific organizations to only see their events."}
      </Text>

      {/* About Section */}
      <SectionHeader title="ABOUT" />
      <View style={[styles.group, shadows.sm, { backgroundColor: theme.surface }]}>
        <Link href="/about" asChild>
          <Pressable accessibilityLabel="About" accessibilityRole="link">
            <SettingsRow icon="information-circle-outline" label="About" />
          </Pressable>
        </Link>
        <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
        <Pressable onPress={showDiagnostics} accessibilityLabel="Show diagnostics" accessibilityRole="button">
          <SettingsRow icon="bug-outline" label="Show Diagnostics" value="Writes [diag-dump] to logs" />
        </Pressable>
        <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
        <Pressable onPress={resetDiagnostics} accessibilityLabel="Reset diagnostics" accessibilityRole="button">
          <SettingsRow icon="trash-outline" label="Reset Diagnostics" />
        </Pressable>
        <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
        <Link href="/updates" asChild>
          <Pressable accessibilityLabel="Updates" accessibilityRole="link">
            <SettingsRow icon="megaphone-outline" label="Updates" />
          </Pressable>
        </Link>
        <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
        <Link href="/privacy" asChild>
          <Pressable accessibilityLabel="Privacy Policy" accessibilityRole="link">
            <SettingsRow icon="shield-checkmark-outline" label="Privacy Policy" />
          </Pressable>
        </Link>
        <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
        <Link href="/terms" asChild>
          <Pressable accessibilityLabel="Terms of Service" accessibilityRole="link">
            <SettingsRow icon="document-text-outline" label="Terms of Service" />
          </Pressable>
        </Link>
      </View>

      <Text style={[styles.version, { color: theme.textTertiary }]}>
        Wyoming Events Calendar v{appVersion}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["4xl"],
  },
  sectionHeader: {
    ...typography.label,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.sm,
  },
  group: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  groupFooter: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    ...typography.body,
    fontWeight: "500",
  },
  rowValue: {
    ...typography.caption,
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
  orgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  orgName: {
    ...typography.body,
    flex: 1,
  },
  unchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  cityPickerScroll: {
    maxHeight: 300,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  viewPickerContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  viewPickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  viewPickerText: {
    ...typography.body,
  },
  version: {
    ...typography.caption,
    textAlign: "center",
    paddingTop: spacing["2xl"],
  },
});
