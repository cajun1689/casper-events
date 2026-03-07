import { useState, useEffect, type FormEvent } from "react";

const COLOR_PALETTE = [
  "#4f46e5", "#7c3aed", "#6366f1", "#ec4899", "#f43f5e", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#8b5cf6", "#a855f7", "#d946ef",
];
import { useNavigate, Navigate, Link } from "react-router-dom";
import { ArrowLeft, Facebook, Globe, Video, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { eventsApi, categoriesApi, api } from "@/lib/api";
import { ImageUpload } from "@/components/ImageUpload";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { RichTextEditor } from "@/components/RichTextEditor";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { token, categories, setCategories } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "",
    allDay: false, venueName: "", address: "", cost: "", ticketUrl: "", imageUrl: "",
    isOnline: false, onlineEventUrl: "", publishToFacebook: false,
    color: "", subtitle: "", externalUrl: "", externalUrlText: "", externalUrlCaption: "",
    featured: false,
  });
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [fbConnected, setFbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      categoriesApi.list().then((res) => setCategories(res.data)).catch(console.error);
    }
  }, [categories.length, setCategories]);

  useEffect(() => {
    if (token) {
      api.get<{ connected: boolean }>("/facebook/pages")
        .then((res) => setFbConnected(res.connected))
        .catch(() => setFbConnected(false));
    }
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCat(id: string) {
    setSelectedCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const startAt = form.allDay ? `${form.startDate}T00:00:00` : `${form.startDate}T${form.startTime}`;
    const endAt = form.endDate || form.endTime
      ? form.allDay ? `${form.endDate || form.startDate}T23:59:59` : `${form.endDate || form.startDate}T${form.endTime || form.startTime}`
      : null;
    try {
      await eventsApi.create({
        title: form.title, description: form.description || null, startAt, endAt,
        allDay: form.allDay, venueName: form.venueName || null, address: form.address || null,
        cost: form.cost || null, ticketUrl: form.ticketUrl || null, imageUrl: form.imageUrl || null,
        isOnline: form.isOnline, onlineEventUrl: form.onlineEventUrl || null,
        publishToFacebook: form.publishToFacebook,
        categoryIds: selectedCats,
        color: form.color || null, subtitle: form.subtitle || null,
        externalUrl: form.externalUrl || null, externalUrlText: form.externalUrlText || null,
        externalUrlCaption: form.externalUrlCaption || null,
        featured: form.featured,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-gray-900">Create New Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
        )}

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Event Details</h2>
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-gray-700">Title *</label>
            <input id="title" type="text" required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputCls} placeholder="Community Potluck Dinner" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
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
            <input type="checkbox" checked={form.allDay} onChange={(e) => update("allDay", e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            All-day event
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1.5 block text-sm font-semibold text-gray-700">Start Date *</label>
              <input id="startDate" type="date" required value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className={inputCls} />
            </div>
            {!form.allDay && (
              <div>
                <label htmlFor="startTime" className="mb-1.5 block text-sm font-semibold text-gray-700">Start Time *</label>
                <input id="startTime" type="time" step="300" required={!form.allDay} value={form.startTime} onChange={(e) => update("startTime", e.target.value)} className={inputCls} />
              </div>
            )}
            <div>
              <label htmlFor="endDate" className="mb-1.5 block text-sm font-semibold text-gray-700">End Date</label>
              <input id="endDate" type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputCls} />
            </div>
            {!form.allDay && (
              <div>
                <label htmlFor="endTime" className="mb-1.5 block text-sm font-semibold text-gray-700">End Time</label>
                <input id="endTime" type="time" step="300" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} className={inputCls} />
              </div>
            )}
          </div>
        </section>

        <section className="relative z-20 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5 overflow-visible">
          <h2 className="text-base font-bold text-gray-900">Location</h2>
          <p className="text-xs text-gray-400 -mt-3">Start typing a venue name or address and we'll suggest matching locations.</p>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isOnline} onChange={(e) => update("isOnline", e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <Globe className="h-4 w-4 text-gray-400" />
            This is an online / virtual event
          </label>

          {form.isOnline && (
            <div className="animate-fade-in">
              <label htmlFor="onlineEventUrl" className="mb-1.5 block text-sm font-semibold text-gray-700">
                <Video className="mr-1 inline h-4 w-4 text-gray-400" />
                Meeting / Streaming URL
              </label>
              <input
                id="onlineEventUrl"
                type="url"
                value={form.onlineEventUrl}
                onChange={(e) => update("onlineEventUrl", e.target.value)}
                className={inputCls}
                placeholder="https://zoom.us/j/123456789 or https://youtube.com/live/..."
              />
              <p className="mt-1 text-xs text-gray-400">Zoom, Google Meet, YouTube Live, etc.</p>
            </div>
          )}

          {!form.isOnline && (
            <AddressAutocomplete
              venueValue={form.venueName}
              addressValue={form.address}
              onVenueChange={(v) => update("venueName", v)}
              onAddressChange={(v) => update("address", v)}
            />
          )}

          {form.isOnline && (
            <div className="rounded-lg bg-blue-50/50 px-3 py-2">
              <p className="text-xs text-blue-600">
                You can still add a physical venue below if the event is hybrid (both in-person and online).
              </p>
              <button
                type="button"
                className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                onClick={() => {
                  const el = document.getElementById("hybrid-venue");
                  if (el) el.classList.toggle("hidden");
                }}
              >
                <ChevronDown className="h-3 w-3" /> Add physical venue
              </button>
              <div id="hybrid-venue" className="hidden mt-3">
                <AddressAutocomplete
                  venueValue={form.venueName}
                  addressValue={form.address}
                  onVenueChange={(v) => update("venueName", v)}
                  onAddressChange={(v) => update("address", v)}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Cost & Tickets</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cost" className="mb-1.5 block text-sm font-semibold text-gray-700">Cost</label>
              <input id="cost" type="text" value={form.cost} onChange={(e) => update("cost", e.target.value)} className={inputCls} placeholder="Free / $10 / Donation" />
            </div>
            <div>
              <label htmlFor="ticketUrl" className="mb-1.5 block text-sm font-semibold text-gray-700">Ticket URL</label>
              <input id="ticketUrl" type="url" value={form.ticketUrl} onChange={(e) => update("ticketUrl", e.target.value)} className={inputCls} placeholder="https://tickets.example.com" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Image</h2>
          <ImageUpload
            value={form.imageUrl}
            onChange={(url) => update("imageUrl", url)}
          />
          <div>
            <label htmlFor="imageUrl" className="mb-1.5 block text-sm font-semibold text-gray-700">Image URL</label>
            <input
              id="imageUrl"
              type="text"
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              className={inputCls}
              placeholder="https://example.com/event-photo.jpg"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Categories</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">No categories available.</p>
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
                  style={selectedCats.includes(cat.id) ? { backgroundColor: cat.color ?? "#4f46e5", boxShadow: `0 4px 14px -3px ${cat.color ?? "#4f46e5"}50` } : undefined}
                >
                  <input type="checkbox" checked={selectedCats.includes(cat.id)} onChange={() => toggleCat(cat.id)} className="sr-only" />
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Appearance & Promotion</h2>
          <p className="text-xs text-gray-400 -mt-3">Optional fields for the poster board embed view.</p>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            Feature this event (show at top of calendar)
          </label>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Card Color</label>
            <p className="mb-2 text-xs text-gray-500">Optional — sets the card color in poster view. If empty, uses the category color.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update("color", form.color === c ? "" : c)}
                  className={`h-8 w-8 rounded-lg border-2 transition-all ${
                    form.color === c ? "border-gray-900 scale-110" : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <input
              type="text"
              value={form.color}
              onChange={(e) => update("color", e.target.value)}
              className={inputCls}
              placeholder="#4f46e5 or leave empty"
              maxLength={25}
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="mb-1.5 block text-sm font-semibold text-gray-700">Subtitle</label>
            <p className="mb-1 text-xs text-gray-500">Short tagline shown under the title, e.g. &quot;Happy St. Patrick&apos;s Day!&quot;</p>
            <input id="subtitle" type="text" maxLength={255} value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} className={inputCls} placeholder="Optional tagline" />
          </div>

          <div>
            <label htmlFor="externalUrl" className="mb-1.5 block text-sm font-semibold text-gray-700">External Link URL</label>
            <p className="mb-1 text-xs text-gray-500">This is separate from your Ticket URL. Use it for sponsor pages, partner links, or registration forms.</p>
            <input id="externalUrl" type="url" value={form.externalUrl} onChange={(e) => update("externalUrl", e.target.value)} className={inputCls} placeholder="https://example.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="externalUrlText" className="mb-1.5 block text-sm font-semibold text-gray-700">Button Text</label>
              <input id="externalUrlText" type="text" maxLength={100} value={form.externalUrlText} onChange={(e) => update("externalUrlText", e.target.value)} className={inputCls} placeholder="Learn More" />
            </div>
            <div>
              <label htmlFor="externalUrlCaption" className="mb-1.5 block text-sm font-semibold text-gray-700">Button Caption</label>
              <input id="externalUrlCaption" type="text" maxLength={255} value={form.externalUrlCaption} onChange={(e) => update("externalUrlCaption", e.target.value)} className={inputCls} placeholder="Check out our sponsor!" />
            </div>
          </div>
        </section>

        {/* Facebook Integration */}
        <section className={clsx(
          "rounded-2xl border p-6 shadow-sm backdrop-blur-sm space-y-5 transition-all",
          form.publishToFacebook
            ? "border-blue-200/60 bg-blue-50/30"
            : "border-gray-200/60 bg-white/80"
        )}>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-md shadow-blue-500/20">
              <Facebook className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900">Facebook Event</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Automatically create a matching event on your connected Facebook Page.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.publishToFacebook}
                onChange={(e) => update("publishToFacebook", e.target.checked)}
                className="peer sr-only"
                disabled={fbConnected === false}
              />
              <div className={clsx(
                "h-6 w-11 rounded-full transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform",
                "peer-checked:bg-[#1877F2] peer-checked:after:translate-x-5",
                fbConnected === false ? "bg-gray-200 cursor-not-allowed" : "bg-gray-300",
              )} />
            </label>
          </div>

          {fbConnected === false && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 border border-amber-200/60">
              <p className="text-sm text-amber-700 font-medium">
                No Facebook Page connected.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Go to <Link to="/dashboard/embed" className="font-bold underline">Settings</Link> to connect your Facebook Page first.
              </p>
            </div>
          )}

          {form.publishToFacebook && fbConnected && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-xl bg-blue-50/80 border border-blue-100 px-4 py-3">
                <p className="text-sm text-blue-700">
                  When you create this event, we'll also create it on your Facebook Page with the same details.
                  The following fields from your event will be sent to Facebook:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-blue-600">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-400" /> <strong>Title</strong> &rarr; Event name
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-400" /> <strong>Description</strong> &rarr; Event description
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-400" /> <strong>Date/Time</strong> &rarr; Start &amp; end time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-400" /> <strong>Venue</strong> &rarr; Event location / place
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-400" /> <strong>Image</strong> &rarr; Cover photo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-400" /> <strong>Ticket URL</strong> &rarr; Ticket link
                  </li>
                  {form.isOnline && (
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-blue-400" /> <strong>Online URL</strong> &rarr; Virtual event link
                    </li>
                  )}
                </ul>
              </div>
              <p className="text-[11px] text-gray-400 italic">
                Requires the <code className="font-mono bg-gray-100 px-1 rounded">pages_manage_events</code> permission from Facebook.
                If this permission isn't approved yet, the Casper Events listing will still be created but the Facebook Event creation will be skipped.
              </p>
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/dashboard" className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700">Cancel</Link>
          <button type="submit" disabled={loading} className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating...</span>
            ) : form.publishToFacebook ? "Create Event + Facebook" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
