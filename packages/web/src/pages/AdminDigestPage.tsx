import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Mail, Plus, Trash2, Download, Image } from "lucide-react";
import { useStore } from "@/lib/store";
import { digestAdminApi, type DigestSubscriber, type DigestSettings } from "@/lib/api";

export default function AdminDigestPage() {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<DigestSubscriber[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DigestSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  function loadSubscribers() {
    digestAdminApi.listSubscribers()
      .then((r) => setSubscribers(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  function loadSettings() {
    digestAdminApi.getSettings()
      .then(setSettings)
      .catch((err) => setSettingsError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    if (!user?.isAdmin) return;
    Promise.all([
      digestAdminApi.listSubscribers().then((r) => setSubscribers(r.data)),
      digestAdminApi.getSettings().then(setSettings),
    ])
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user?.isAdmin]);

  if (!user?.isAdmin) return <Navigate to="/" replace />;

  async function handleAdd() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    setError(null);
    try {
      await digestAdminApi.addSubscriber(email);
      setNewEmail("");
      loadSubscribers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await digestAdminApi.deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      await digestAdminApi.exportSubscribers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleSaveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const updated = await digestAdminApi.updateSettings(settings);
      setSettings(updated);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingSettings(false);
    }
  }

  function updateSettingsField<K extends keyof DigestSettings>(key: K, value: DigestSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function addSponsor() {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            sponsors: [...prev.sponsors, { name: "", url: "", logoUrl: "" }],
          }
        : null
    );
  }

  function removeSponsor(i: number) {
    setSettings((prev) =>
      prev
        ? { ...prev, sponsors: prev.sponsors.filter((_, j) => j !== i) }
        : null
    );
  }

  function updateSponsor(i: number, field: "name" | "url" | "logoUrl", value: string) {
    setSettings((prev) => {
      if (!prev) return null;
      const next = [...prev.sponsors];
      next[i] = { ...next[i], [field]: value };
      return { ...prev, sponsors: next };
    });
  }

  function addExtraLink() {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            extraLinks: [...prev.extraLinks, { label: "", url: "" }],
          }
        : null
    );
  }

  function removeExtraLink(i: number) {
    setSettings((prev) =>
      prev
        ? { ...prev, extraLinks: prev.extraLinks.filter((_, j) => j !== i) }
        : null
    );
  }

  function updateExtraLink(i: number, field: "label" | "url", value: string) {
    setSettings((prev) => {
      if (!prev) return null;
      const next = [...prev.extraLinks];
      next[i] = { ...next[i], [field]: value };
      return { ...prev, extraLinks: next };
    });
  }

  function addLatestNews() {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            latestNews: [...prev.latestNews, { imageUrl: "", title: "", author: "", date: "", summary: "", url: "" }],
          }
        : null
    );
  }

  function removeLatestNews(i: number) {
    setSettings((prev) =>
      prev ? { ...prev, latestNews: prev.latestNews.filter((_, j) => j !== i) } : null
    );
  }

  function updateLatestNews(i: number, field: "imageUrl" | "title" | "author" | "date" | "summary" | "url", value: string) {
    setSettings((prev) => {
      if (!prev) return null;
      const next = [...prev.latestNews];
      next[i] = { ...next[i], [field]: value };
      return { ...prev, latestNews: next };
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Digest Subscribers & Settings
        </h1>
      </div>

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
        <div className="space-y-8">
          {/* Subscribers */}
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Subscribers</h2>
            <p className="text-sm text-gray-500 mb-4">
              Add or remove subscribers manually. Export to CSV for external use.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className={inputCls + " max-w-xs"}
              />
              <button
                onClick={handleAdd}
                disabled={adding}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> {adding ? "Adding..." : "Add"}
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {subscribers.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No subscribers yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {subscribers.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-gray-50/50"
                    >
                      <span className="flex-1 text-sm text-gray-900">{s.email}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> {deletingId === s.id ? "..." : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Digest settings */}
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Digest email content</h2>
            <p className="text-sm text-gray-500 mb-6">
              Customize the weekly digest email: header image, footer text, sponsors, and extra links.
            </p>

            {settingsError && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {settingsError}
              </div>
            )}

            {settings && (
              <div className="space-y-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Header image URL
                  </label>
                  <div className="flex gap-2">
                    <Image className="h-5 w-5 text-gray-400 mt-2.5 shrink-0" />
                    <input
                      type="url"
                      value={settings.headerImageUrl}
                      onChange={(e) => updateSettingsField("headerImageUrl", e.target.value)}
                      placeholder="https://..."
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Email header (HTML)
                  </label>
                  <textarea
                    value={settings.emailHeader}
                    onChange={(e) => updateSettingsField("emailHeader", e.target.value)}
                    placeholder="Optional HTML before event list"
                    rows={3}
                    className={inputCls + " font-mono text-xs"}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Email footer (HTML)
                  </label>
                  <textarea
                    value={settings.emailFooter}
                    onChange={(e) => updateSettingsField("emailFooter", e.target.value)}
                    placeholder="Optional HTML after event list"
                    rows={3}
                    className={inputCls + " font-mono text-xs"}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Sponsors</label>
                    <button
                      onClick={addSponsor}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      + Add sponsor
                    </button>
                  </div>
                  <div className="space-y-3">
                    {settings.sponsors.map((sp, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap gap-3 items-start rounded-xl border border-gray-100 p-3 bg-gray-50/50"
                      >
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
                        <input
                          type="url"
                          value={sp.logoUrl ?? ""}
                          onChange={(e) => updateSponsor(i, "logoUrl", e.target.value)}
                          placeholder="Logo URL"
                          className={inputCls + " flex-1 min-w-[120px]"}
                        />
                        <button
                          onClick={() => removeSponsor(i)}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Latest News</label>
                    <button
                      onClick={addLatestNews}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      + Add news item
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Optional. Only shown in the digest when items are added. Leave empty to hide this section.
                  </p>
                  <div className="space-y-3">
                    {settings.latestNews.map((n, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 bg-gray-50/50"
                      >
                        <div className="flex flex-wrap gap-3">
                          <input
                            type="url"
                            value={n.imageUrl}
                            onChange={(e) => updateLatestNews(i, "imageUrl", e.target.value)}
                            placeholder="Image URL"
                            className={inputCls + " flex-1 min-w-[120px]"}
                          />
                          <input
                            type="text"
                            value={n.title}
                            onChange={(e) => updateLatestNews(i, "title", e.target.value)}
                            placeholder="Title"
                            className={inputCls + " flex-1 min-w-[120px]"}
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <input
                            type="text"
                            value={n.author}
                            onChange={(e) => updateLatestNews(i, "author", e.target.value)}
                            placeholder="Author (e.g. Oil City Staff)"
                            className={inputCls + " flex-1 min-w-[100px]"}
                          />
                          <input
                            type="text"
                            value={n.date}
                            onChange={(e) => updateLatestNews(i, "date", e.target.value)}
                            placeholder="Date (e.g. 2 days ago)"
                            className={inputCls + " flex-1 min-w-[100px]"}
                          />
                        </div>
                        <textarea
                          value={n.summary}
                          onChange={(e) => updateLatestNews(i, "summary", e.target.value)}
                          placeholder="Summary"
                          rows={2}
                          className={inputCls}
                        />
                        <input
                          type="url"
                          value={n.url ?? ""}
                          onChange={(e) => updateLatestNews(i, "url", e.target.value)}
                          placeholder="Article URL"
                          className={inputCls}
                        />
                        <button
                          onClick={() => removeLatestNews(i)}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold self-start"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Extra links</label>
                    <button
                      onClick={addExtraLink}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      + Add link
                    </button>
                  </div>
                  <div className="space-y-3">
                    {settings.extraLinks.map((link, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap gap-3 items-center rounded-xl border border-gray-100 p-3 bg-gray-50/50"
                      >
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateExtraLink(i, "label", e.target.value)}
                          placeholder="Link label"
                          className={inputCls + " flex-1 min-w-[100px]"}
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateExtraLink(i, "url", e.target.value)}
                          placeholder="URL"
                          className={inputCls + " flex-1 min-w-[120px]"}
                        />
                        <button
                          onClick={() => removeExtraLink(i)}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : "Save digest settings"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
