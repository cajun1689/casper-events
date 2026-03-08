import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Ticket, Plus, Copy, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { adminApi } from "@/lib/api";

interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  usedAt: string | null;
  usedByOrgId: string | null;
}

export default function AdminBetaPage() {
  const { user } = useStore();
  const [requireInviteCode, setRequireInviteCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function load() {
    Promise.all([adminApi.getBetaStatus(), adminApi.listInviteCodes()])
      .then(([status, list]) => {
        setRequireInviteCode(status.requireInviteCode);
        setCodes(list.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!user?.isAdmin) return;
    load();
  }, [user?.isAdmin]);

  if (!user?.isAdmin) return <Navigate to="/" replace />;

  async function handleToggle() {
    setSaving(true);
    setError(null);
    try {
      const next = !requireInviteCode;
      await adminApi.setBetaStatus(next);
      setRequireInviteCode(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const code = newCode.trim().toUpperCase() || undefined;
      const created = await adminApi.createInviteCode(code);
      setCodes((prev) => [{ ...created, createdAt: new Date().toISOString(), usedAt: null, usedByOrgId: null }, ...prev]);
      setNewCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  function copyToClipboard(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/admin" className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
          <Ticket className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Beta & Invite Codes</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-base font-bold text-gray-900 mb-2">Beta mode</h2>
            <p className="text-sm text-gray-500 mb-4">
              When enabled, new signups must provide a valid invite code to create an organization.
            </p>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={requireInviteCode}
                onChange={handleToggle}
                disabled={saving}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                {requireInviteCode ? "Invite code required" : "Open signup"}
              </span>
              {saving && <span className="text-xs text-gray-400">Saving...</span>}
            </label>
          </div>

          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-base font-bold text-gray-900 mb-2">Create invite code</h2>
            <p className="text-sm text-gray-500 mb-4">
              Leave blank to auto-generate an 8-character code, or enter a custom code (min 4 characters).
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className={inputCls + " max-w-xs"}
                placeholder="e.g. BETA2025 or leave blank"
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Invite codes</h2>
              <p className="text-sm text-gray-500">All codes (used and unused)</p>
            </div>
            <div className="divide-y divide-gray-100">
              {codes.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No invite codes yet. Create one above.
                </div>
              ) : (
                codes.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/50"
                  >
                    <code className="flex-1 font-mono text-sm font-bold tracking-wider text-gray-900">
                      {c.code}
                    </code>
                    <span className="text-xs text-gray-500">
                      {c.usedAt
                        ? `Used ${new Date(c.usedAt).toLocaleDateString()}`
                        : "Available"}
                    </span>
                    <button
                      onClick={() => copyToClipboard(c.code, c.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      {copiedId === c.id ? (
                        <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copy</>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
