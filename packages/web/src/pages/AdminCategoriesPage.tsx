import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, X, Tags } from "lucide-react";
import { useStore } from "@/lib/store";
import { categoriesApi, api } from "@/lib/api";
import type { CategoryPublic } from "@cyh/shared";

interface CategoryForm {
  name: string;
  slug: string;
  icon: string;
  color: string;
  sortOrder: number;
}

const emptyForm: CategoryForm = { name: "", slug: "", icon: "", color: "#4f46e5", sortOrder: 0 };

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminCategoriesPage() {
  const { user } = useStore();
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi.list().then((res) => {
      setCategories([...res.data].sort((a, b) => a.sortOrder - b.sortOrder));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (!user?.isAdmin) return <Navigate to="/" replace />;

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: categories.length > 0 ? Math.max(...categories.map((c) => c.sortOrder)) + 1 : 0 });
    setShowForm(true);
  }

  function openEdit(cat: CategoryPublic) {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon ?? "", color: cat.color ?? "#4f46e5", sortOrder: cat.sortOrder });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditingId(null); setForm(emptyForm); }

  function handleNameChange(value: string) {
    setForm((prev) => ({ ...prev, name: value, slug: editingId ? prev.slug : slugify(value) }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name, slug: form.slug, icon: form.icon || null, color: form.color || null, sortOrder: form.sortOrder };
      if (editingId) {
        const updated = await api.put<CategoryPublic>(`/categories/${editingId}`, payload);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
      } else {
        const created = await api.post<CategoryPublic>("/categories", payload);
        setCategories((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      closeForm();
    } catch (err) {
      console.error("Failed to save category:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <Tags className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Categories</h1>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm animate-fade-in-scale">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">{editingId ? "Edit Category" : "New Category"}</h2>
            <button onClick={closeForm} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Name</label>
              <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} placeholder="Category name" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} className={inputCls + " font-mono"} placeholder="category-slug" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Icon (emoji)</label>
              <input type="text" value={form.icon} onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))} className={inputCls} placeholder="🎵" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))} className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 p-0.5" />
                <input type="text" value={form.color} onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))} className={inputCls + " font-mono"} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))} className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={closeForm} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14 rounded-2xl" />)}</div>
      ) : categories.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-gray-200/60 bg-white/70 py-20 text-center shadow-sm backdrop-blur-sm">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-lg font-bold text-gray-400 mb-2">No categories yet</p>
          <button onClick={openAdd} className="text-sm font-semibold text-primary-600 hover:text-primary-700">Create your first category</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm">
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat.id} className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/30">
                <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                <div className="h-6 w-6 shrink-0 rounded-lg shadow-sm" style={{ backgroundColor: cat.color ?? "#e5e7eb" }} />
                {cat.icon && <span className="shrink-0 text-lg">{cat.icon}</span>}
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-gray-900">{cat.name}</span>
                  <span className="ml-2 font-mono text-xs text-gray-400">{cat.slug}</span>
                </div>
                <span className="text-xs font-semibold text-gray-300">#{cat.sortOrder}</span>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(cat)} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100" title="Edit">
                    <Pencil className="h-4 w-4 text-gray-400" />
                  </button>
                  {deleteConfirm === cat.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(cat.id)} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-red-700">Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(cat.id)} className="rounded-lg p-1.5 transition-colors hover:bg-red-50" title="Delete">
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
