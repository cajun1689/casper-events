import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { spacing, typography } from "@/src/theme";
import { isToday, isTomorrow, format } from "date-fns";

interface SectionDateHeaderProps {
  dateKey: string;
}

export function SectionDateHeader({ dateKey }: SectionDateHeaderProps) {
  const theme = useAppTheme();
  const date = new Date(dateKey + "T12:00:00");

  let label: string;
  if (isToday(date)) {
    label = "Today";
  } else if (isTomorrow(date)) {
    label = "Tomorrow";
  } else {
    label = format(date, "EEEE, MMMM d");
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  label: {
    ...typography.headline,
  },
});
