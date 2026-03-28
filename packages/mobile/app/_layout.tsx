import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";

import { useColorScheme } from "@/components/useColorScheme";
import { installGlobalErrorHandler, logBreadcrumb } from "@/src/lib/crash-logger";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    installGlobalErrorHandler();
    logBreadcrumb("app-root-mounted", {
      platform: "mobile",
      loadedInitially: loaded,
    });
  }, []);

  useEffect(() => {
    if (error) {
      logBreadcrumb("font-load-error", {
        message: error.message,
        stack: error.stack,
      });
      throw new Error(`RootLayout font load failed: ${error.message}`);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      logBreadcrumb("fonts-loaded");
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    logBreadcrumb("notification-listener-register");
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const data = response.notification.request.content
            .data as Record<string, unknown>;
          const eventId =
            (data?.eventId as string) ??
            (data?.url as string)?.match?.(/\/events\/([^/]+)/)?.[1];

          logBreadcrumb("notification-response", {
            hasEventId: Boolean(eventId),
            keys: Object.keys(data ?? {}),
          });

          if (eventId) {
            router.push(`/events/${eventId}`);
          }
        } catch (listenerError) {
          logBreadcrumb("notification-listener-error", {
            message:
              listenerError instanceof Error
                ? listenerError.message
                : "unknown-notification-listener-error",
          });
          throw listenerError;
        }
      }
    );

    return () => {
      logBreadcrumb("notification-listener-remove");
      sub.remove();
    };
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Settings" }} />
        <Stack.Screen name="about" options={{ title: "About" }} />
        <Stack.Screen name="updates" options={{ title: "Updates" }} />
        <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
        <Stack.Screen name="terms" options={{ title: "Terms of Service" }} />
        <Stack.Screen name="events/[id]" options={{ title: "" }} />
        <Stack.Screen name="organizations/[slug]" options={{ title: "" }} />
      </Stack>
    </ThemeProvider>
  );
}
