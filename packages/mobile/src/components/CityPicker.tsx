import { View, Text, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { useState } from "react";
import { WYOMING_CITIES } from "@/lib/wyoming-cities";
import { useStore } from "@/lib/store";
import { Colors } from "@/lib/constants";

export function CityPicker() {
  const [visible, setVisible] = useState(false);
  const { selectedCity, setSelectedCity } = useStore();
  const displayCity = selectedCity || "All Wyoming";

  const handleSelect = (city: string) => {
    setSelectedCity(city === "All Wyoming" ? null : city);
    setVisible(false);
  };

  return (
    <View>
      <Pressable
        style={styles.button}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`City filter: ${displayCity}`}
        accessibilityHint="Tap to change city"
      >
        <Text style={styles.buttonText}>📍 {displayCity}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} accessibilityRole="header">
              Select City
            </Text>
            <Pressable
              onPress={() => setVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close city picker"
            >
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>
          <FlatList
            data={WYOMING_CITIES as unknown as string[]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected =
                (item === "All Wyoming" && !selectedCity) ||
                item === selectedCity;
              return (
                <Pressable
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => handleSelect(item)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={item}
                >
                  <Text
                    style={[styles.rowText, isSelected && styles.rowTextSelected]}
                  >
                    {item}
                  </Text>
                  {isSelected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "12",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  chevron: {
    fontSize: 12,
    color: Colors.primary,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  rowSelected: {
    backgroundColor: Colors.primary + "08",
  },
  rowText: {
    fontSize: 16,
    color: Colors.text,
  },
  rowTextSelected: {
    fontWeight: "600",
    color: Colors.primary,
  },
  check: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
});
