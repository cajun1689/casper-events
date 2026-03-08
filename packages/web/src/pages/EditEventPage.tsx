import { useState, useEffect, type FormEvent } from "react";

const COLOR_PALETTE = [
  "#4f46e5", "#7c3aed", "#6366f1", "#ec4899", "#f43f5e", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#8b5cf6", "#a855f7", "#d946ef",
];
import { useNavigate, Navigate, Link, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Video, ChevronDown, Trash2, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { eventsApi, categoriesApi, orgCategoriesApi } from "@/lib/api";
import { ImageUpload } from "@/components/ImageUpload";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { RichTextEditor } from "@/components/RichTextEditor";
import { EventSponsorsSection } from "@/components/EventSponsorsSection";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user, organization, categories, setCategories } = useStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "",
    allDay: false, venueName: "", address: "", latitude: null as number | null, longitude: null as number | null,
    cost: "", ticketUrl: "", imageUrl: "",
    isOnline: false, onlineEventUrl: "",
    color: "", subtitle: "", externalUrl: "", externalUrlText: "", externalUrlCaption: "",
    featured: false,
    schedulePublish: false,
    publishAtDate: "", publishAtTime: "",
  });
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedOrgCats, setSelectedOrgCats] = useState<string[]>([]);
  const [orgCategories, setOrgCategories] = useState<{ id: string; name: string; slug: string; icon: string | null; color: string | null; parentCategoryId: string; parentCategory?: { name: string } }[]>([]);
  const [backTo, setBackTo] = useState("/dashboard");

  useEffect(() => {
    if (categories.length === 0) {
      categoriesApi.list().then((res) => setCategories(res.data)).catch(console.error);
    }
  }, [categories.length, setCategories]);

  useEffect(() => {
    if (organization?.id) {
      orgCategoriesApi.list(organization.id).then((res) => setOrgCategories(res.data)).catch(() => setOrgCategories([]));
    }
  }, [organization?.id]);

  useEffect(() => {
    if (!token || !id) return;
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "admin") setBackTo("/admin/events");

    eventsApi.get(id).then((event) => {
      const start = new Date(event.startAt);
      const end = event.endAt ? new Date(event.endAt) : null;
      setForm({
        title: event.title,
        description: event.description || "",
        startDate: start.toISOString().slice(0, 10),
        startTime: start.toTimeString().slice(0, 5),
        endDate: end ? end.toISOString().slice(0, 10) : "",
        endTime: end ? end.toTimeString().slice(0, 5) : "",
        allDay: event.allDay,
        venueName: event.venueName || "",
        address: event.address || "",
        latitude: event.latitude ?? null,
        longitude: event.longitude ?? null,
        cost: event.cost || "",
        ticketUrl: event.ticketUrl || "",
        imageUrl: event.imageUrl || "",
        isOnline: event.isOnline || false,
        onlineEventUrl: event.onlineEventUrl || "",
        color: event.color || "",
        subtitle: event.subtitle || "",
        externalUrl: event.externalUrl || "",
        externalUrlText: event.externalUrlText || "",
        externalUrlCaption: event.externalUrlCaption || "",
        featured: event.featured ?? false,
        schedulePublish: !!(event as { publishAt?: string | null }).publishAt,
        publishAtDate: (event as { publishAt?: string | null }).publishAt
          ? new Date((event as { publishAt: string }).publishAt).toISOString().slice(0, 10)
          : "",
        publishAtTime: (event as { publishAt?: string | null }).publishAt
          ? new Date((event as { publishAt: string }).publishAt).toTimeString().slice(0, 5)
          : "",
      });
      setSelectedCats(event.categories?.map((c: { id: string }) => c.id) || []);
      setSelectedOrgCats(event.orgCategories?.map((oc: { id: string }) => oc.id) || []);
      setFetching(false);
    }).catch(() => {
      setError("Event not found");
      setFetching(false);
    });
  }, [token, id]);

  if (!token) return <Navigate to="/login" replace />;

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCat(catId: string) {
    setSelectedCats((prev) => prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]);
  }

  function toggleOrgCat(id: string) {
    setSelectedOrgCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setLoading(true);
    const startAt = form.allDay ? `${form.startDate}T00:00:00` : `${form.startDate}T${form.startTime}`;
    const endAt = form.endDate || form.endTime
      ? form.allDay ? `${form.endDate || form.startDate}T23:59:59` : `${form.endDate || form.startDate}T${form.endTime || form.startTime}`
      : null;
    const publishAt = form.schedulePublish && form.publishAtDate
      ? `${form.publishAtDate}T${form.publishAtTime || "00:00:00"}`
      : null;
    try {
      await eventsApi.update(id, {
        title: form.title, description: form.description || null, startAt, endAt,
        allDay: form.allDay, venueName: form.venueName || null, address: form.address || null,
        latitude: form.latitude, longitude: form.longitude,
        cost: form.cost || null, ticketUrl: form.ticketUrl || null, imageUrl: form.imageUrl || null,
        isOnline: form.isOnline, onlineEventUrl: form.onlineEventUrl || null,
        categoryIds: selectedCats,
        orgCategoryIds: selectedOrgCats,
        color: form.color || null, subtitle: form.subtitle || null,
        externalUrl: form.externalUrl || null, externalUrlText: form.externalUrlText || null,
        externalUrlCaption: form.externalUrlCaption || null,
        featured: form.featured,
        publishAt: publishAt || undefined,
      });
      navigate(backTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await eventsApi.delete(id);
      navigate(backTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  if (fetching) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <Link to={backTo} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Edit Event</h1>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">Are you sure you want to delete this event?</p>
          <p className="mt-1 text-xs text-red-600">This action cannot be undone.</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
        )}

        <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Event Details</h2>
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-gray-700">Title *</label>
            <input id="title" type="text" required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
            <RichTextEditor value={form.description} onChange={(html) => update("description", html)} placeholder="Tell people about your event…" />
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

          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.schedulePublish} onChange={(e) => update("schedulePublish", e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <Clock className="h-4 w-4 text-gray-400" />
              Schedule publish (prep event, show on calendar at a specific time)
            </label>
            {form.schedulePublish && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="publishAtDate" className="mb-1.5 block text-sm font-semibold text-gray-700">Publish Date</label>
                  <input id="publishAtDate" type="date" required={form.schedulePublish} value={form.publishAtDate} onChange={(e) => update("publishAtDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="publishAtTime" className="mb-1.5 block text-sm font-semibold text-gray-700">Publish Time</label>
                  <input id="publishAtTime" type="time" step="300" value={form.publishAtTime} onChange={(e) => update("publishAtTime", e.target.value)} className={inputCls} />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="relative z-20 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5 overflow-visible">
          <h2 className="text-base font-bold text-gray-900">Location</h2>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isOnline} onChange={(e) => update("isOnline", e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <Globe className="h-4 w-4 text-gray-400" /> This is an online / virtual event
          </label>
          {form.isOnline && (
            <div className="animate-fade-in">
              <label htmlFor="onlineEventUrl" className="mb-1.5 block text-sm font-semibold text-gray-700">
                <Video className="mr-1 inline h-4 w-4 text-gray-400" /> Meeting / Streaming URL
              </label>
              <input id="onlineEventUrl" type="url" value={form.onlineEventUrl} onChange={(e) => update("onlineEventUrl", e.target.value)} className={inputCls} placeholder="https://zoom.us/j/123456789" />
            </div>
          )}
          {!form.isOnline && (
            <AddressAutocomplete venueValue={form.venueName} addressValue={form.address} onVenueChange={(v) => update("venueName", v)} onAddressChange={(v) => update("address", v)} onCoordsChange={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />
          )}
          {form.isOnline && (
            <div className="rounded-lg bg-blue-50/50 px-3 py-2">
              <p className="text-xs text-blue-600">You can still add a physical venue below if the event is hybrid.</p>
              <button type="button" className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1" onClick={() => document.getElementById("hybrid-venue-edit")?.classList.toggle("hidden")}>
                <ChevronDown className="h-3 w-3" /> Add physical venue
              </button>
              <div id="hybrid-venue-edit" className="hidden mt-3">
                <AddressAutocomplete venueValue={form.venueName} addressValue={form.address} onVenueChange={(v) => update("venueName", v)} onAddressChange={(v) => update("address", v)} onCoordsChange={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />
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
          <ImageUpload value={form.imageUrl} onChange={(url) => update("imageUrl", url)} />
          <div>
            <label htmlFor="imageUrl" className="mb-1.5 block text-sm font-semibold text-gray-700">Image URL</label>
            <input id="imageUrl" type="text" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} className={inputCls} />
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
          {orgCategories.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-gray-700 pt-2 border-t border-gray-100">Your sub-categories (optional)</h3>
              <div className="flex flex-wrap gap-2">
                {orgCategories.map((oc) => (
                  <label
                    key={oc.id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                      selectedOrgCats.includes(oc.id)
                        ? "border-transparent text-white shadow-md"
                        : "border-gray-200/80 bg-white/60 text-gray-600 hover:bg-white hover:shadow"
                    }`}
                    style={selectedOrgCats.includes(oc.id) ? { backgroundColor: oc.color ?? "#4f46e5", boxShadow: `0 4px 14px -3px ${oc.color ?? "#4f46e5"}50` } : undefined}
                  >
                    <input type="checkbox" checked={selectedOrgCats.includes(oc.id)} onChange={() => toggleOrgCat(oc.id)} className="sr-only" />
                    {oc.icon && <span>{oc.icon}</span>}
                    {oc.name}
                    {oc.parentCategory && <span className="text-xs opacity-75">({oc.parentCategory.name})</span>}
                  </label>
                ))}
              </div>
            </>
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

        <EventSponsorsSection eventId={id!} />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to={backTo} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700">Cancel</Link>
          <button type="submit" disabled={loading} className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving...</span>
            ) : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
