import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, Stack } from "expo-router";
import { categoriesApi, publicEventsApi } from "@/src/lib/api";
import type { CategoryPublic } from "@cyh/shared";

function formatDateTime(date: string, time: string): string {
  if (!time) return `${date}T00:00:00`;
  const [h, m] = time.split(":");
  return `${date}T${h}:${m}:00`;
}

export default function SubmitEventScreen() {
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const toggleCat = (id: string) => {
    setSelectedCats((p) =>
      p.includes(id) ? p.filter((c) => c !== id) : [...p, id]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.startDate) {
      setError("Start date is required");
      return;
    }
    if (!form.allDay && !form.startTime) {
      setError("Start time is required for timed events");
      return;
    }
    if (!form.submitterName.trim()) {
      setError("Your name is required");
      return;
    }
    if (!form.submitterEmail.trim()) {
      setError("Your email is required");
      return;
    }

    setLoading(true);
    try {
      const startAt = form.allDay
        ? `${form.startDate}T00:00:00`
        : formatDateTime(form.startDate, form.startTime);
      const endAt =
        form.endDate || form.endTime
          ? form.allDay
            ? `${form.endDate || form.startDate}T23:59:59`
            : formatDateTime(
                form.endDate || form.startDate,
                form.endTime || form.startTime
              )
          : null;

      await publicEventsApi.submit({
        title: form.title.trim(),
        description: form.description.trim() || null,
        startAt,
        endAt,
        allDay: form.allDay,
        venueName: form.venueName.trim() || null,
        address: form.address.trim() || null,
        cost: form.cost.trim() || null,
        ticketUrl: form.ticketUrl.trim() || null,
        categoryIds: selectedCats,
        submitterName: form.submitterName.trim(),
        submitterEmail: form.submitterEmail.trim(),
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Stack.Screen options={{ title: "Thank You" }} />
        <View style={styles.container}>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successText}>
            Your event has been submitted. An administrator will review it and
            publish it to the calendar.
          </Text>
          <Link href="/" asChild>
            <Pressable style={styles.successBtn}>
              <Text style={styles.successBtnText}>Back to Events</Text>
            </Pressable>
          </Link>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Submit Event" }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.hint}>
            Have an event to share? Submit it below. Our team will review and
            publish it.
          </Text>

          {error && (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(v) => update("title", v)}
              placeholder="Community Potluck Dinner"
              accessibilityLabel="Event title"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(v) => update("description", v)}
              placeholder="Tell people about your event…"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>All-day event</Text>
              <Switch
                value={form.allDay}
                onValueChange={(v) => update("allDay", v)}
                accessibilityLabel="All-day event"
              />
            </View>
            <Text style={styles.label}>Start Date *</Text>
            <TextInput
              style={styles.input}
              value={form.startDate}
              onChangeText={(v) => update("startDate", v)}
              placeholder="YYYY-MM-DD"
              accessibilityLabel="Start date"
            />
            {!form.allDay && (
              <>
                <Text style={styles.label}>Start Time *</Text>
                <TextInput
                  style={styles.input}
                  value={form.startTime}
                  onChangeText={(v) => update("startTime", v)}
                  placeholder="HH:MM"
                  accessibilityLabel="Start time"
                />
              </>
            )}
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={form.endDate}
              onChangeText={(v) => update("endDate", v)}
              placeholder="YYYY-MM-DD"
            />
            {!form.allDay && (
              <>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={form.endTime}
                  onChangeText={(v) => update("endTime", v)}
                  placeholder="HH:MM"
                />
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Venue name</Text>
            <TextInput
              style={styles.input}
              value={form.venueName}
              onChangeText={(v) => update("venueName", v)}
              placeholder="Community Center"
            />
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={form.address}
              onChangeText={(v) => update("address", v)}
              placeholder="123 Main St, City, WY"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Cost</Text>
            <TextInput
              style={styles.input}
              value={form.cost}
              onChangeText={(v) => update("cost", v)}
              placeholder="Free / $10 / Donation"
            />
            <Text style={styles.label}>Ticket URL</Text>
            <TextInput
              style={styles.input}
              value={form.ticketUrl}
              onChangeText={(v) => update("ticketUrl", v)}
              placeholder="https://..."
              keyboardType="url"
            />
          </View>

          {categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Categories</Text>
              <View style={styles.catRow}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.catChip,
                      selectedCats.includes(cat.id) && styles.catChipSelected,
                    ]}
                    onPress={() => toggleCat(cat.id)}
                    accessibilityLabel={`${cat.name}, ${selectedCats.includes(cat.id) ? "selected" : "not selected"}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        selectedCats.includes(cat.id) && styles.catChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Your Name *</Text>
            <TextInput
              style={styles.input}
              value={form.submitterName}
              onChangeText={(v) => update("submitterName", v)}
              placeholder="Jane Doe"
              accessibilityLabel="Your name"
            />
            <Text style={styles.label}>Your Email *</Text>
            <TextInput
              style={styles.input}
              value={form.submitterEmail}
              onChangeText={(v) => update("submitterEmail", v)}
              placeholder="jane@example.com"
              keyboardType="email-address"
              accessibilityLabel="Your email"
            />
          </View>

          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel="Submit event"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Event</Text>
            )}
          </Pressable>

          <Link href="/" asChild>
            <Pressable style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  hint: { fontSize: 14, color: "#666", marginBottom: 16 },
  error: { backgroundColor: "#fee", padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: "#c00" },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  catChipSelected: { backgroundColor: "#2563eb" },
  catChipText: { fontSize: 14 },
  catChipTextSelected: { color: "#fff", fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cancelBtn: { padding: 16, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#666", fontSize: 16 },
  successTitle: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  successText: { fontSize: 16, color: "#666", marginBottom: 24 },
  successBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  successBtnText: { color: "#fff", fontWeight: "600" },
});
