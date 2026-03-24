import AsyncStorage from "@react-native-async-storage/async-storage";

const ORG_FILTER_KEY = "selected_org_filter_ids";

/** Get the set of org IDs the user wants to see events from. Empty = show all. */
export async function getFilteredOrgIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ORG_FILTER_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function setFilteredOrgIds(ids: string[]): Promise<void> {
  try {
    if (ids.length === 0) {
      await AsyncStorage.removeItem(ORG_FILTER_KEY);
    } else {
      await AsyncStorage.setItem(ORG_FILTER_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore
  }
}
