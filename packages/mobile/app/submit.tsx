import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { publicEventsApi, categoriesApi } from "@/lib/api";
import { Colors } from "@/lib/constants";
import type { CategoryPublic } from "@cyh/shared";

export default function SubmitEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    venueName: "",
    address: "",
    cost: "",
    ticketUrl: "",
    submitterName: "",
    submitterEmail: "",
  });

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.startDate || !form.submitterName.trim() || !form.submitterEmail.trim()) {
      Alert.alert("Required Fields", "Please fill in all required fields: title, date, your name, and email.");
      return;
    }

    setLoading(true);
    try {
      const startAt = form.startTime
        ? `${form.startDate}T${form.startTime}:00`
        : `${form.startDate}T00:00:00`;
      const endAt =
        form.endDate && form.endTime
          ? `${form.endDate}T${form.endTime}:00`
          : undefined;

      await publicEventsApi.submit({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        allDay: form.allDay,
        venueName: form.venueName.trim() || undefined,
        address: form.address.trim() || undefined,
        cost: form.cost.trim() || undefined,
        ticketUrl: form.ticketUrl.trim() || undefined,
        categoryIds: selectedCats,
        submitterName: form.submitterName.trim(),
        submitterEmail: form.submitterEmail.trim().toLowerCase(),
      });

      Alert.alert(
        "Event Submitted",
        "Your event has been submitted for review. Thank you!",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert(
        "Submission Failed",
        err instanceof Error ? err.message : "Could not submit event",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Submit a community event for Wyoming Events Calendar. Events are
          reviewed before publishing.
        </Text>

        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(v) => update("title", v)}
          placeholder="e.g. Summer Music Festival"
          placeholderTextColor={Colors.textSecondary}
          accessibilityLabel="Event title, required"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.description}
          onChangeText={(v) => update("description", v)}
          placeholder="Tell people about this event..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          accessibilityLabel="Event description"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Start Date *</Text>
            <TextInput
              style={styles.input}
              value={form.startDate}
              onChangeText={(v) => update("startDate", v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textSecondary}
              accessibilityLabel="Start date, required"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              value={form.startTime}
              onChangeText={(v) => update("startTime", v)}
              placeholder="HH:MM"
              placeholderTextColor={Colors.textSecondary}
              accessibilityLabel="Start time"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={form.endDate}
              onChangeText={(v) => update("endDate", v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textSecondary}
              accessibilityLabel="End date"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>End Time</Text>
            <TextInput
              style={styles.input}
              value={form.endTime}
              onChangeText={(v) => update("endTime", v)}
              placeholder="HH:MM"
              placeholderTextColor={Colors.textSecondary}
              accessibilityLabel="End time"
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>All Day Event</Text>
          <Switch
            value={form.allDay}
            onValueChange={(v) => update("allDay", v)}
            trackColor={{ true: Colors.primary }}
            accessibilityLabel="All day event toggle"
          />
        </View>

        <Text style={styles.label}>Venue Name</Text>
        <TextInput
          style={styles.input}
          value={form.venueName}
          onChangeText={(v) => update("venueName", v)}
          placeholder="e.g. David Street Station"
          placeholderTextColor={Colors.textSecondary}
          accessibilityLabel="Venue name"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={form.address}
          onChangeText={(v) => update("address", v)}
          placeholder="e.g. 200 S David St, Casper, WY"
          placeholderTextColor={Colors.textSecondary}
          accessibilityLabel="Event address"
        />

        <Text style={styles.label}>Cost</Text>
        <TextInput
          style={styles.input}
          value={form.cost}
          onChangeText={(v) => update("cost", v)}
          placeholder="e.g. Free, $10"
          placeholderTextColor={Colors.textSecondary}
          accessibilityLabel="Event cost"
        />

        <Text style={styles.label}>Ticket URL</Text>
        <TextInput
          style={styles.input}
          value={form.ticketUrl}
          onChangeText={(v) => update("ticketUrl", v)}
          placeholder="https://..."
          placeholderTextColor={Colors.textSecondary}
          keyboardType="url"
          accessibilityLabel="Ticket URL"
        />

        {categories.length > 0 && (
          <>
            <Text style={styles.label}>Categories</Text>
            <View style={styles.chips}>
              {categories.map((cat) => {
                const sel = selectedCats.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.chip, sel && styles.chipActive]}
                    onPress={() =>
                      setSelectedCats((prev) =>
                        sel
                          ? prev.filter((id) => id !== cat.id)
                          : [...prev, cat.id],
                      )
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: sel }}
                    accessibilityLabel={cat.name}
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextActive]}
                    >
                      {cat.icon ? `${cat.icon} ` : ""}
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text style={[styles.label, { marginTop: 16 }]}>Your Name *</Text>
        <TextInput
          style={styles.input}
          value={form.submitterName}
          onChangeText={(v) => update("submitterName", v)}
          placeholder="Jane Doe"
          placeholderTextColor={Colors.textSecondary}
          textContentType="name"
          accessibilityLabel="Your name, required"
        />

        <Text style={styles.label}>Your Email *</Text>
        <TextInput
          style={styles.input}
          value={form.submitterEmail}
          onChangeText={(v) => update("submitterEmail", v)}
          placeholder="jane@example.com"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          accessibilityLabel="Your email, required"
        />

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Submit event"
          accessibilityState={{ disabled: loading }}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Submitting..." : "Submit Event"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 44,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multiline: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.textInverse,
    fontWeight: "700",
    fontSize: 16,
  },
});
