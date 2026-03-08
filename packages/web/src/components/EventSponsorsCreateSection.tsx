import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

const SPONSOR_LEVELS = [
  { value: "presenting", label: "Presenting" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
  { value: "community", label: "Community" },
] as const;

export interface PendingSponsor {
  _key: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  level: string;
}

interface EventSponsorsCreateSectionProps {
  value: PendingSponsor[];
  onChange: (sponsors: PendingSponsor[]) => void;
}

export function EventSponsorsCreateSection({ value: sponsors, onChange }: EventSponsorsCreateSectionProps) {
  const [adding, setAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<PendingSponsor, "_key"> & { _key?: string }>({
    name: "",
    logoUrl: null,
    websiteUrl: null,
    level: "community",
  });

  function resetForm() {
    setForm({ name: "", logoUrl: null, websiteUrl: null, level: "community" });
    setAdding(false);
    setEditingIndex(null);
  }

  function handleAdd() {
    if (!form.name.trim()) return;
    onChange([...sponsors, { _key: crypto.randomUUID(), name: form.name.trim(), logoUrl: form.logoUrl, websiteUrl: form.websiteUrl, level: form.level }]);
    resetForm();
  }

  function handleUpdate() {
    if (!form.name.trim() || editingIndex === null) return;
    const existing = sponsors[editingIndex];
    const next = [...sponsors];
    next[editingIndex] = { ...existing, name: form.name.trim(), logoUrl: form.logoUrl, websiteUrl: form.websiteUrl, level: form.level };
    onChange(next);
    resetForm();
  }

  function handleDelete(index: number) {
    onChange(sponsors.filter((_, i) => i !== index));
    if (editingIndex === index) resetForm();
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  }

  function startEdit(index: number) {
    const s = sponsors[index];
    setForm({ name: s.name, logoUrl: s.logoUrl, websiteUrl: s.websiteUrl, level: s.level });
    setEditingIndex(index);
    setAdding(false);
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  const grouped = SPONSOR_LEVELS.reduce((acc, { value }) => {
    acc[value] = sponsors.filter((s) => s.level === value);
    return acc;
  }, {} as Record<string, PendingSponsor[]>);

  return (
    <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm space-y-5">
      <h2 className="text-base font-bold text-gray-900">Sponsors</h2>
      <p className="text-xs text-gray-400 -mt-3">Add sponsor logos and links for the poster board embed view. They will be attached when the event is created.</p>

      {sponsors.length > 0 && (
        <div className="space-y-4">
          {SPONSOR_LEVELS.map(({ value, label }) => {
            const list = grouped[value] ?? [];
            if (list.length === 0) return null;
            return (
              <div key={value}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{label}</div>
                <div className="flex flex-wrap gap-3">
                  {list.map((s) => {
                    const globalIdx = sponsors.indexOf(s);
                    return (
                      <div
                        key={s._key}
                        className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white/60 p-3"
                      >
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain bg-gray-50" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{s.name}</div>
                          {s.websiteUrl && (
                            <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline truncate block">
                              {s.websiteUrl.replace(/^https?:\/\//, "").slice(0, 30)}…
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(globalIdx)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(globalIdx)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 text-red-600"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(adding || editingIndex !== null) ? (
        <div className="rounded-xl border border-primary-200/60 bg-primary-50/20 p-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Sponsor Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Logo</label>
            <ImageUpload
              value={form.logoUrl ?? ""}
              onChange={(url) => setForm((f) => ({ ...f, logoUrl: url || null }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Website URL</label>
            <input
              type="url"
              value={form.websiteUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value || null }))}
              className={inputCls}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Level</label>
            <select
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className={inputCls}
            >
              {SPONSOR_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => editingIndex !== null ? handleUpdate() : handleAdd()}
              disabled={!form.name.trim()}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {editingIndex !== null ? "Save" : "Add Sponsor"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setAdding(true); setForm({ name: "", logoUrl: null, websiteUrl: null, level: "community" }); }}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-primary-300 hover:bg-primary-50/30 hover:text-primary-700 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Sponsor
        </button>
      )}
    </section>
  );
}
