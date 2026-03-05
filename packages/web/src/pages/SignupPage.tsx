import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { authApi } from "@/lib/api";
import { useStore } from "@/lib/store";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { setAuth } = useStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
    orgSlug: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "orgName" && !slugEdited) {
        next.orgSlug = slugify(value);
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = (await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        organizationName: form.orgName,
        organizationSlug: form.orgSlug,
      })) as {
        token: string;
        user: { sub: string; email: string; name?: string };
        organization: { id: string; name: string; slug: string };
      };

      setAuth(res.token, res.user, res.organization);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create an account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Register your organization to start posting events
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="Min. 8 characters"
              />
            </div>

            <hr className="border-gray-200" />

            <div>
              <label
                htmlFor="orgName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                required
                value={form.orgName}
                onChange={(e) => update("orgName", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="Community Arts Center"
              />
            </div>

            <div>
              <label
                htmlFor="orgSlug"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Organization Slug
              </label>
              <input
                id="orgSlug"
                type="text"
                required
                pattern="[a-z0-9-]+"
                value={form.orgSlug}
                onChange={(e) => {
                  setSlugEdited(true);
                  update("orgSlug", e.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="community-arts-center"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL-friendly identifier (lowercase, hyphens only)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
