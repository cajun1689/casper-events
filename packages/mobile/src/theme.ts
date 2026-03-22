import { Platform, TextStyle, ViewStyle } from "react-native";

export const colors = {
  primary: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  white: "#ffffff",
  black: "#000000",
  red: { 50: "#fef2f2", 500: "#ef4444", 600: "#dc2626" },
  green: { 50: "#f0fdf4", 500: "#22c55e", 600: "#16a34a" },
  amber: { 50: "#fffbeb", 500: "#f59e0b", 600: "#d97706" },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 20,
  full: 9999,
} as const;

const fontFamily = Platform.select({
  ios: "Inter",
  android: "Inter",
  default: "Inter",
});

export const typography = {
  largeTitle: {
    fontFamily: `${fontFamily}_700Bold`,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  } as TextStyle,
  title: {
    fontFamily: `${fontFamily}_700Bold`,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  } as TextStyle,
  headline: {
    fontFamily: `${fontFamily}_600SemiBold`,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  } as TextStyle,
  body: {
    fontFamily: `${fontFamily}_400Regular`,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  callout: {
    fontFamily: `${fontFamily}_400Regular`,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontFamily: `${fontFamily}_400Regular`,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  label: {
    fontFamily: `${fontFamily}_600SemiBold`,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  } as TextStyle,
} as const;

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  md: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle,
  lg: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
} as const;

export const lightTheme = {
  text: colors.gray[900],
  textSecondary: colors.gray[500],
  textTertiary: colors.gray[400],
  background: colors.gray[50],
  surface: colors.white,
  surfaceSecondary: colors.gray[100],
  tint: colors.primary[600],
  border: colors.gray[200],
  borderLight: colors.gray[100],
  tabIconDefault: colors.gray[400],
  tabIconSelected: colors.primary[600],
  cardBackground: colors.white,
  skeleton: colors.gray[200],
  skeletonHighlight: colors.gray[100],
} as const;

export const darkTheme = {
  text: colors.gray[50],
  textSecondary: colors.gray[400],
  textTertiary: colors.gray[500],
  background: colors.black,
  surface: colors.gray[900],
  surfaceSecondary: colors.gray[800],
  tint: colors.primary[400],
  border: colors.gray[700],
  borderLight: colors.gray[800],
  tabIconDefault: colors.gray[500],
  tabIconSelected: colors.primary[400],
  cardBackground: colors.gray[900],
  skeleton: colors.gray[800],
  skeletonHighlight: colors.gray[700],
} as const;

export type AppTheme = {
  [K in keyof typeof lightTheme]: string;
};
