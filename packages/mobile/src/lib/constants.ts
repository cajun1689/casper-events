import { colors, lightTheme } from "@/theme";

/**
 * API base URL. Set EXPO_PUBLIC_API_URL in .env for local development.
 * Default: production API.
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "https://api.casperevents.org/v1";

/**
 * Flat color palette used by components in static StyleSheet.create() calls.
 * Based on the light theme with additional semantic tokens.
 */
export const Colors = {
  ...lightTheme,
  primary: colors.primary[600],
  textInverse: colors.white,
  success: colors.green[500],
  error: colors.red[500],
} as const;
