import AsyncStorage from "@react-native-async-storage/async-storage";
import { ALL_WYOMING_VALUE } from "./wyoming-cities";

const SELECTED_CITY_KEY = "selectedCity";

export async function getSelectedCity(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(SELECTED_CITY_KEY);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function setSelectedCity(city: string | null): Promise<void> {
  try {
    if (city === null || city === ALL_WYOMING_VALUE) {
      await AsyncStorage.removeItem(SELECTED_CITY_KEY);
    } else {
      await AsyncStorage.setItem(SELECTED_CITY_KEY, city);
    }
  } catch {
    // Ignore storage errors
  }
}
