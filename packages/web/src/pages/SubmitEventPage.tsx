import { useState, useEffect, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { categoriesApi, publicEventsApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { RichTextEditor } from "@/components/RichTextEditor";

export default function SubmitEventPage() {
  const { token, categories, setCategories } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
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

  if (!token) return <Navigate to="/login" replace />;

  useEffect(() => {
    if (categories.length === 0) {
      categoriesApi.list().then((res) => setCategories(res.data)).catch(console.error);
    }
  }, [categories.length, setCategories]);

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCat(id: string) {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const startAt = form.allDay
      ? `${form.startDate}T00:00:00`
      : `${form.startDate}T${form.startTime}`;
    const endAt =
      form.endDate || form.endTime
        ? form.allDay
          ? `${form.endDate || form.startDate}T23:59:59`
          : `${form.endDate || form.startDate}T${form.endTime || form.startTime}`
        : null;
    try {
      await publicEventsApi.submit({
        title: form.title,
        description: form.description || null,
        startAt,
        endAt,
        allDay: form.allDay,
        venueName: form.venueName || null,
        address: form.address || null,
        cost: form.cost || null,
        ticketUrl: form.ticketUrl || null,
        categoryIds: selectedCats,
        submitterName: form.submitterName,
        submitterEmail: form.submitterEmail,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit event");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center animate-fade-in">
        <div className="mb-6 text-5xl">✅</div>
        <h1 className="mb-4 text-2xl font-extrabold text-gray-900">
          Thank You!
        </h1>
        <p className="mb-8 text-gray-600">
          Your event has been submitted. An administrator will review it and
          publish it to the community calendar. You will not receive a
          confirmation email, but your event will appear once approved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Calendar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Calendar
      </Link>

      <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900">
        Submit an Event
      </h1>
      <p className="mb-8 text-gray-600">
        Have an event to share? Submit it below. Our team will review and
        publish it to the community calendar.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Event Details</h2>
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className={inputCls}
              placeholder="Community Potluck Dinner"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Description
            </label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => update("description", html)}
              placeholder="Tell people about your event…"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Date & Time</h2>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => update("allDay", e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            All-day event
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Start Date *
              </label>
              <input
                id="startDate"
                type="date"
                required
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className={inputCls}
              />
            </div>
            {!form.allDay && (
              <div>
                <label
                  htmlFor="startTime"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Start Time *
                </label>
                <input
                  id="startTime"
                  type="time"
                  step="300"
                  required={!form.allDay}
                  value={form.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label
                htmlFor="endDate"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                className={inputCls}
              />
            </div>
            {!form.allDay && (
              <div>
                <label
                  htmlFor="endTime"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  End Time
                </label>
                <input
                  id="endTime"
                  type="time"
                  step="300"
                  value={form.endTime}
                  onChange={(e) => update("endTime", e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Location</h2>
          <AddressAutocomplete
            venueValue={form.venueName}
            addressValue={form.address}
            onVenueChange={(v) => update("venueName", v)}
            onAddressChange={(v) => update("address", v)}
          />
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Cost & Tickets</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="cost"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Cost
              </label>
              <input
                id="cost"
                type="text"
                value={form.cost}
                onChange={(e) => update("cost", e.target.value)}
                className={inputCls}
                placeholder="Free / $10 / Donation"
              />
            </div>
            <div>
              <label
                htmlFor="ticketUrl"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Ticket URL
              </label>
              <input
                id="ticketUrl"
                type="url"
                value={form.ticketUrl}
                onChange={(e) => update("ticketUrl", e.target.value)}
                className={inputCls}
                placeholder="https://tickets.example.com"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Categories</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">Loading categories…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                    selectedCats.includes(cat.id)
                      ? "border-transparent text-white shadow-md"
                      : "border-gray-200/80 bg-white/60 text-gray-600 hover:bg-white hover:shadow"
                  }`}
                  style={
                    selectedCats.includes(cat.id)
                      ? {
                          backgroundColor: cat.color ?? "#4f46e5",
                          boxShadow: `0 4px 14px -3px ${cat.color ?? "#4f46e5"}50`,
                        }
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(cat.id)}
                    onChange={() => toggleCat(cat.id)}
                    className="sr-only"
                  />
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Your Contact Info</h2>
          <p className="text-xs text-gray-500 -mt-3">
            We&apos;ll use this if we need to follow up about your submission.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="submitterName"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Your Name *
              </label>
              <input
                id="submitterName"
                type="text"
                required
                value={form.submitterName}
                onChange={(e) => update("submitterName", e.target.value)}
                className={inputCls}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label
                htmlFor="submitterEmail"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Your Email *
              </label>
              <input
                id="submitterEmail"
                type="email"
                required
                value={form.submitterEmail}
                onChange={(e) => update("submitterEmail", e.target.value)}
                className={inputCls}
                placeholder="jane@example.com"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit Event"}
          </button>
          <Link
            to="/"
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
