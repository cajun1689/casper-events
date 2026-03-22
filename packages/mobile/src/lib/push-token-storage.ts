import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_TOKEN_KEY = "expo_push_token";

export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredPushToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export async function clearStoredPushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch {
    // ignore
  }
}
