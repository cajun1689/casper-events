import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { eventsApi, categoriesApi } from "@/lib/api";
import type { CategoryPublic } from "@cyh/shared";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { token, categories, setCategories } = useStore();

  const [loading, setLoading] = useState(false);
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
    imageUrl: "",
  });
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  useEffect(() => {
    if (categories.length === 0) {
      categoriesApi
        .list()
        .then((res) => setCategories(res.data))
        .catch(console.error);
    }
  }, [categories.length, setCategories]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

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
      await eventsApi.create({
        title: form.title,
        description: form.description || null,
        startAt,
        endAt,
        allDay: form.allDay,
        venueName: form.venueName || null,
        address: form.address || null,
        cost: form.cost || null,
        ticketUrl: form.ticketUrl || null,
        imageUrl: form.imageUrl || null,
        categoryIds: selectedCats,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Create New Event
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Basic info */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">
            Event Details
          </h2>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1.5"
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
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className={inputCls + " resize-y"}
              placeholder="Tell people about your event…"
            />
          </div>
        </section>

        {/* Date & time */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">
            Date & Time
          </h2>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => update("allDay", e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            All-day event
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1.5"
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
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Start Time *
                </label>
                <input
                  id="startTime"
                  type="time"
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
                className="block text-sm font-medium text-gray-700 mb-1.5"
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
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  End Time
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update("endTime", e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        </section>

        {/* Location */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Location</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="venueName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Venue Name
              </label>
              <input
                id="venueName"
                type="text"
                value={form.venueName}
                onChange={(e) => update("venueName", e.target.value)}
                className={inputCls}
                placeholder="Community Center"
              />
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Address
              </label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className={inputCls}
                placeholder="123 Main St, Anytown"
              />
            </div>
          </div>
        </section>

        {/* Cost & tickets */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">
            Cost & Tickets
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium text-gray-700 mb-1.5"
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
                className="block text-sm font-medium text-gray-700 mb-1.5"
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

        {/* Image */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Image</h2>

          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Image URL
            </label>
            <input
              id="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              className={inputCls}
              placeholder="https://example.com/event-photo.jpg"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Direct link to an image. Upload support coming soon.
            </p>
          </div>

          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}

          {!form.imageUrl && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Paste an image URL above to preview
              </p>
            </div>
          )}
        </section>

        {/* Categories */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Categories</h2>

          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">No categories available.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                    selectedCats.includes(cat.id)
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
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

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/dashboard"
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
