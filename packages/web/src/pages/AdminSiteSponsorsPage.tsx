import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Award, Plus, Trash2 } from "lucide-react";
import { ImageUrlOrUpload } from "@/components/ImageUrlOrUpload";
import { useStore } from "@/lib/store";
import { adminApi, type SiteSponsor } from "@/lib/api";

const SPONSOR_LEVELS = [
  { value: "presenting", label: "Presenting" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
  { value: "community", label: "Community" },
] as const;

export default function AdminSiteSponsorsPage() {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [sponsors, setSponsors] = useState<SiteSponsor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) return;
    adminApi
      .getSiteSponsors()
      .then((r) => setSponsors(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user?.isAdmin]);

  if (!user?.isAdmin) return <Navigate to="/" replace />;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateSiteSponsors(sponsors);
      setSponsors(updated.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function addSponsor() {
    setSponsors((prev) => [
      ...prev,
      {
        name: "",
        logoUrl: "",
        url: "",
        level: "community",
        sortOrder: prev.length,
      },
    ]);
  }

  function removeSponsor(i: number) {
    setSponsors((prev) => prev.filter((_, j) => j !== i));
  }

  function updateSponsor(
    i: number,
    field: keyof SiteSponsor,
    value: string | number
  ) {
    setSponsors((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/admin"
          className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
          <Award className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Site Sponsors
        </h1>
      </div>

      <p className="mb-6 text-sm text-gray-500">
        Sponsors shown on the main events page (below the calendar). Not shown in the embed.
      </p>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Sponsors</h2>
              <button
                onClick={addSponsor}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px"
              >
                <Plus className="h-4 w-4" /> Add sponsor
              </button>
            </div>

            <div className="space-y-4">
              {sponsors.map((sp, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 bg-gray-50/50"
                >
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="text"
                      value={sp.name}
                      onChange={(e) => updateSponsor(i, "name", e.target.value)}
                      placeholder="Sponsor name"
                      className={inputCls + " flex-1 min-w-[120px]"}
                    />
                    <input
                      type="url"
                      value={sp.url}
                      onChange={(e) => updateSponsor(i, "url", e.target.value)}
                      placeholder="Website URL"
                      className={inputCls + " flex-1 min-w-[120px]"}
                    />
                    <select
                      value={sp.level}
                      onChange={(e) =>
                        updateSponsor(
                          i,
                          "level",
                          e.target.value as SiteSponsor["level"]
                        )
                      }
                      className={inputCls + " w-36"}
                    >
                      {SPONSOR_LEVELS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block mb-1">
                      Logo
                    </span>
                    <ImageUrlOrUpload
                      value={sp.logoUrl}
                      onChange={(url) => updateSponsor(i, "logoUrl", url)}
                      placeholder="Logo URL or upload"
                      className={inputCls + " flex-1 min-w-0"}
                    />
                  </div>
                  <button
                    onClick={() => removeSponsor(i)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold self-start"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {sponsors.length > 0 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save site sponsors"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
