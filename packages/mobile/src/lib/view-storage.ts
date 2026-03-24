import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ViewMode } from "@/components/ViewToggle";

const VIEW_MODE_KEY = "defaultViewMode";
const VALID_MODES: ViewMode[] = ["cards", "list", "poster", "calendar", "map"];

export async function getDefaultViewMode(): Promise<ViewMode> {
  try {
    const value = await AsyncStorage.getItem(VIEW_MODE_KEY);
    if (value && VALID_MODES.includes(value as ViewMode)) {
      return value as ViewMode;
    }
    return "cards";
  } catch {
    return "cards";
  }
}

export async function setDefaultViewMode(mode: ViewMode): Promise<void> {
  try {
    await AsyncStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
}
