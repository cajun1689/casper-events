import { useState, useEffect, useRef, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, Building2, Plus, X, Pencil, ImagePlus, Loader2, Check } from "lucide-react";
import { format } from "date-fns";
import { useStore } from "@/lib/store";
import { adminApi, uploadApi } from "@/lib/api";
import type { OrganizationPublic } from "@cyh/shared";

const statusBadge: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  suspended: "bg-red-50 text-red-600",
};

function OrgLogoUpload({ logoUrl, onUpload }: { logoUrl: string | null; onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const url = await uploadApi.uploadFile(file, "logos");
      onUpload(url);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:border-primary-300"
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {uploading ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          </div>
        ) : logoUrl ? (
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50/80">
            <ImagePlus className="h-5 w-5 text-gray-300" />
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      <div className="text-xs text-gray-400">
        <p className="font-semibold text-gray-600">Logo</p>
        <p>Click to upload. Square image recommended.</p>
      </div>
    </div>
  );
}

export default function AdminOrgsPage() {
  const { user } = useStore();
  const [orgs, setOrgs] = useState<OrganizationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ orgName: "", contactName: "", contactEmail: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState<{ success: boolean; message: string; tempPassword?: string } | null>(null);

  useEffect(() => {
    adminApi.organizations().then((res) => setOrgs(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (!user?.isAdmin) return <Navigate to="/" replace />;

  async function handleStatusChange(id: string, status: string) {
    setMenuOpen(null);
    setUpdating(id);
    try {
      await adminApi.updateOrgStatus(id, status);
      setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err) {
      console.error("Failed to update org status:", err);
    } finally {
      setUpdating(null);
    }
  }

  function startEdit(org: OrganizationPublic) {
    setEditingId(org.id);
    setEditName(org.name);
    setEditLogo(org.logoUrl ?? null);
    setMenuOpen(null);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    setEditSaving(true);
    try {
      const slug = editName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const updated = await adminApi.updateOrganization(editingId, {
        name: editName.trim(),
        slug,
        logoUrl: editLogo,
      });
      setOrgs((prev) => prev.map((o) => (o.id === editingId ? { ...o, name: updated.name, slug: updated.slug, logoUrl: updated.logoUrl } : o)));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update org:", err);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleAddOrg(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddResult(null);
    try {
      const slug = addForm.orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const res = await adminApi.createOrganization({
        orgName: addForm.orgName,
        orgSlug: slug,
        contactName: addForm.contactName,
        contactEmail: addForm.contactEmail,
      });
      setAddResult({ success: true, message: `Organization "${addForm.orgName}" created. Welcome email sent to ${addForm.contactEmail}.`, tempPassword: res.tempPassword });
      setOrgs((prev) => [...prev, res.organization]);
      setAddForm({ orgName: "", contactName: "", contactEmail: "" });
    } catch (err) {
      setAddResult({ success: false, message: err instanceof Error ? err.message : "Failed to create organization" });
    } finally {
      setAddLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Organizations</h1>
        </div>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setAddResult(null); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add Organization"}
        </button>
      </div>

      {/* Add Organization Form */}
      {showAddForm && (
        <div className="mb-6 rounded-2xl border border-primary-200/60 bg-white/90 p-6 shadow-sm backdrop-blur-sm animate-fade-in">
          <h2 className="mb-1 text-base font-bold text-gray-900">Add Organization Manually</h2>
          <p className="mb-5 text-sm text-gray-500">Create an organization and user account. They'll receive a welcome email with a temporary password and will be asked to change it on first login.</p>

          {addResult && (
            <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${addResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {addResult.message}
              {addResult.tempPassword && (
                <div className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-mono text-gray-700">
                  Temporary password (backup): <span className="font-bold select-all">{addResult.tempPassword}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleAddOrg} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Organization Name</label>
              <input type="text" value={addForm.orgName} onChange={(e) => setAddForm({ ...addForm, orgName: e.target.value })} className={inputCls} placeholder="Casper Youth Center" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Contact Name</label>
              <input type="text" value={addForm.contactName} onChange={(e) => setAddForm({ ...addForm, contactName: e.target.value })} className={inputCls} placeholder="Jane Smith" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Contact Email</label>
              <input type="email" value={addForm.contactEmail} onChange={(e) => setAddForm({ ...addForm, contactEmail: e.target.value })} className={inputCls} placeholder="jane@example.com" required />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" disabled={addLoading} className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50">
                {addLoading ? "Creating..." : "Create Organization & Send Welcome Email"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending approval queue */}
      {!loading && orgs.filter((o) => o.status === "pending").length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-5 shadow-sm backdrop-blur-sm animate-fade-in">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-extrabold text-white">
              {orgs.filter((o) => o.status === "pending").length}
            </span>
            Pending Approval
          </h2>
          <div className="space-y-2">
            {orgs.filter((o) => o.status === "pending").map((org) => (
              <div key={org.id} className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white">
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-400">{org.slug}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(org.id, "active")}
                    disabled={updating === org.id}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(org.id, "suspended")}
                    disabled={updating === org.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : orgs.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/60 bg-white/70 py-20 text-center shadow-sm backdrop-blur-sm">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-lg font-bold text-gray-400">No organizations found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => {
            const isEditing = editingId === org.id;

            return (
              <div
                key={org.id}
                className={`rounded-2xl border bg-white/70 shadow-sm backdrop-blur-sm transition-all ${
                  isEditing ? "border-primary-200/60 ring-2 ring-primary-100" : "border-gray-200/60"
                } ${updating === org.id ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Logo */}
                  {isEditing ? (
                    <OrgLogoUpload logoUrl={editLogo} onUpload={(url) => setEditLogo(url)} />
                  ) : (
                    <div className="shrink-0">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover ring-2 ring-gray-100" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white">
                          {org.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Name / slug */}
                  {isEditing ? (
                    <div className="flex-1 min-w-0">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Organization Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={inputCls}
                        autoFocus
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Slug: <span className="font-mono">{editName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{org.name}</p>
                      <p className="text-xs font-mono text-gray-400">{org.slug}</p>
                    </div>
                  )}

                  {/* Status */}
                  {!isEditing && (
                    <span className={`shrink-0 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadge[org.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {org.status}
                    </span>
                  )}

                  {/* Date */}
                  {!isEditing && (
                    <span className="hidden sm:block shrink-0 text-xs text-gray-400">
                      {(org as unknown as Record<string, unknown>).createdAt
                        ? format(new Date((org as unknown as Record<string, unknown>).createdAt as string), "MMM d, yyyy")
                        : "—"}
                    </span>
                  )}

                  {/* Actions */}
                  {isEditing ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={editSaving || !editName.trim()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 transition-all hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <button onClick={() => setMenuOpen(menuOpen === org.id ? null : org.id)} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                      {menuOpen === org.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-200/80 bg-white py-1 shadow-xl z-50">
                          <button onClick={() => startEdit(org)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                            <Pencil className="h-3.5 w-3.5" /> Edit Details
                          </button>
                          {org.status !== "active" && (
                            <button onClick={() => handleStatusChange(org.id, "active")} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                              <Check className="h-3.5 w-3.5" /> Activate
                            </button>
                          )}
                          {org.status !== "suspended" && (
                            <button onClick={() => handleStatusChange(org.id, "suspended")} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                              <X className="h-3.5 w-3.5" /> Suspend
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
