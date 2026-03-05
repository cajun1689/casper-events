import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";
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

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  icon: "",
  color: "#3b82f6",
  sortOrder: 0,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
    categoriesApi
      .list()
      .then((res) => {
        const sorted = [...res.data].sort((a, b) => a.sortOrder - b.sortOrder);
        setCategories(sorted);
      })
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => setLoading(false));
  }, []);

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  function openAdd() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sortOrder: categories.length > 0
        ? Math.max(...categories.map((c) => c.sortOrder)) + 1
        : 0,
    });
    setShowForm(true);
  }

  function openEdit(cat: CategoryPublic) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon ?? "",
      color: cat.color ?? "#3b82f6",
      sortOrder: cat.sortOrder,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: editingId ? prev.slug : slugify(value),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        icon: form.icon || null,
        color: form.color || null,
        sortOrder: form.sortOrder,
      };

      if (editingId) {
        const updated = await api.put<CategoryPublic>(
          `/categories/${editingId}`,
          payload
        );
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c))
        );
      } else {
        const created = await api.post<CategoryPublic>("/categories", payload);
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder)
        );
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {editingId ? "Edit Category" : "New Category"}
            </h2>
            <button
              onClick={closeForm}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="category-slug"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Icon (emoji)
              </label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, icon: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="🎵"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">No categories yet.</p>
          <button
            onClick={openAdd}
            className="text-blue-600 font-medium hover:underline"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                <div
                  className="w-5 h-5 rounded-md shrink-0 border border-gray-200"
                  style={{ backgroundColor: cat.color ?? "#e5e7eb" }}
                />
                {cat.icon && (
                  <span className="text-lg shrink-0">{cat.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{cat.name}</span>
                  <span className="ml-2 text-xs text-gray-400 font-mono">
                    {cat.slug}
                  </span>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  #{cat.sortOrder}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  {deleteConfirm === cat.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
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
