import { useColorScheme } from "@/components/useColorScheme";
import { lightTheme, darkTheme, AppTheme } from "@/src/theme";

export function useAppTheme(): AppTheme {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
