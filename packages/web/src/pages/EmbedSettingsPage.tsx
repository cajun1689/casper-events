import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Code2, Palette, Copy, Check, Eye, Link2, Unlink, ArrowLeft, ChevronDown, Globe, RefreshCw, Filter } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { api, categoriesApi } from "@/lib/api";
import type { EmbedConfigPublic, OrganizationPublic, CategoryPublic } from "@cyh/shared";
import { EmbedApp } from "@cyh/embed/components/EmbedApp";

const PLATFORM_GUIDES: { id: string; name: string; icon: string; steps: string[] }[] = [
  {
    id: "squarespace",
    name: "Squarespace",
    icon: "◼",
    steps: [
      "Open the page where you want the calendar and click Edit.",
      "Click an insert point (+) and choose Code from the block menu.",
      "Paste the embed code above into the code block.",
      "Toggle the \"Display Source\" switch OFF so it renders as HTML.",
      "Click Apply, then Save the page.",
    ],
  },
  {
    id: "wordpress",
    name: "WordPress",
    icon: "W",
    steps: [
      "Open the page or post in the WordPress editor.",
      "Add a Custom HTML block (click + → search \"Custom HTML\").",
      "Paste the embed code into the HTML block.",
      "Click Preview to verify the calendar loads.",
      "Publish or Update the page.",
      "Note: If using Elementor, use the HTML widget instead.",
    ],
  },
  {
    id: "wix",
    name: "Wix",
    icon: "⬡",
    steps: [
      "Open the Wix Editor and go to the target page.",
      "Click Add (+) → Embed Code → Embed HTML.",
      "Select \"Code\" mode and paste the embed code.",
      "Resize the widget to fit your page layout.",
      "Click Publish to make the calendar live.",
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: "S",
    steps: [
      "Go to Online Store → Pages and open the target page.",
      "In the content editor, click the <> (Show HTML) button.",
      "Paste the embed code into the HTML view.",
      "Save the page and preview your storefront.",
      "For theme sections: edit your Liquid template and paste the code where desired.",
    ],
  },
  {
    id: "html",
    name: "Custom HTML / Other",
    icon: "</>",
    steps: [
      "Open your website's HTML file in a code editor.",
      "Find the location where you want the calendar (usually inside the <body> tag).",
      "Paste the embed code directly into the HTML.",
      "Save and upload the file to your hosting provider.",
      "The calendar will render automatically when the page loads.",
    ],
  },
];

function PlatformGuides({ embedCode }: { embedCode: string }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow">
          <Globe className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-base font-bold text-gray-900">How to Install</h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Select your website platform for step-by-step instructions.
      </p>
      <div className="space-y-2">
        {PLATFORM_GUIDES.map((platform) => (
          <div key={platform.id} className="rounded-xl border border-gray-200/60 overflow-hidden">
            <button
              onClick={() => setOpenId(openId === platform.id ? null : platform.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50/80"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                  {platform.icon}
                </span>
                <span className="text-sm font-bold text-gray-900">{platform.name}</span>
              </div>
              <ChevronDown
                className={clsx(
                  "h-4 w-4 text-gray-400 transition-transform",
                  openId === platform.id && "rotate-180",
                )}
              />
            </button>
            {openId === platform.id && (
              <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
                <ol className="space-y-2.5">
                  {platform.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {platform.id === "squarespace" && (
                  <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                    <strong>Tip:</strong> Squarespace Business plan or higher is required for code injection. On lower plans, use the Code Injection area under Settings → Advanced → Code Injection instead.
                  </div>
                )}
                {platform.id === "wordpress" && (
                  <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                    <strong>Tip:</strong> If your WordPress site uses a security plugin that strips scripts, you may need to whitelist <code className="rounded bg-amber-100 px-1">casperevents.org</code> in your Content Security Policy settings.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LivePreview({ config, orgId }: { config: EmbedConfigPublic; orgId: string }) {
  const [previewKey, setPreviewKey] = useState(0);

  const embedConfig = useMemo(
    () => ({
      container: "#cyh-preview",
      orgId,
      apiUrl: import.meta.env.VITE_API_URL || "/api",
      showConnectedOrgs: config.showConnectedOrgs,
      theme: {
        primaryColor: config.primaryColor,
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
        accentColor: config.accentColor,
        fontFamily: config.fontFamily,
        borderRadius: config.borderRadius,
      },
      defaultView: config.defaultView as "month" | "week" | "list" | "poster",
      hiddenCategories: config.categoryFilter ?? [],
    }),
    [config, orgId],
  );

  return (
    <div className="mt-8 rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200/60 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow">
            <Eye className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Live Preview</h2>
            <p className="text-xs text-gray-400">This is how the calendar will look when embedded on a website</p>
          </div>
        </div>
        <button
          onClick={() => setPreviewKey((k) => k + 1)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/60 px-3 py-1.5 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:bg-white hover:shadow"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-[repeating-conic-gradient(#f3f4f6_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-6">
        <style>{`
          @keyframes cyh-spin { to { transform: rotate(360deg); } }
          @keyframes cyh-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes cyh-scale-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        `}</style>
        <div
          className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl shadow-2xl shadow-gray-300/50"
          style={{ borderRadius: config.borderRadius }}
        >
          <EmbedApp key={previewKey} config={embedConfig} />
        </div>
      </div>
    </div>
  );
}

export default function EmbedSettingsPage() {
  const { token, organization } = useStore();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<EmbedConfigPublic[]>([]);
  const [activeConfig, setActiveConfig] = useState<EmbedConfigPublic | null>(null);
  const [connections, setConnections] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [allOrgs, setAllOrgs] = useState<OrganizationPublic[]>([]);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<CategoryPublic[]>([]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!organization) return;
    Promise.all([
      api.get<{ data: EmbedConfigPublic[] }>(`/embed/config/${organization.id}`),
      api.get<{ data: { id: string; name: string; slug: string }[] }>(`/organizations/${organization.id}/connections`),
      api.get<{ data: OrganizationPublic[] }>("/organizations"),
      categoriesApi.list(),
    ]).then(([configRes, connRes, orgsRes, catsRes]) => {
      setConfigs(configRes.data);
      if (configRes.data.length > 0) setActiveConfig(configRes.data[0]);
      setConnections(connRes.data);
      setAllOrgs(orgsRes.data.filter((o) => o.id !== organization.id));
      setAllCategories(catsRes.data);
      setLoading(false);
    });
  }, [token, organization, navigate]);

  const updateConfig = useCallback(
    async (field: string, value: string | boolean | string[]) => {
      if (!activeConfig) return;
      setActiveConfig({ ...activeConfig, [field]: value } as EmbedConfigPublic);
    },
    [activeConfig],
  );

  const saveConfig = async () => {
    if (!activeConfig) return;
    setSaving(true);
    try {
      const { id, orgId, ...data } = activeConfig;
      await api.put(`/embed/config/${id}`, data);
    } finally {
      setSaving(false);
    }
  };

  const hiddenCats = activeConfig?.categoryFilter?.length ? activeConfig.categoryFilter : [];
  const embedCode = activeConfig
    ? `<div id="cyh-calendar"></div>\n<script src="https://casperevents.org/embed.js"></script>\n<script>\n  CYHCalendar.init({\n    container: '#cyh-calendar',\n    orgId: '${organization?.id}',\n    showConnectedOrgs: ${activeConfig.showConnectedOrgs},\n    theme: {\n      primaryColor: '${activeConfig.primaryColor}',\n      backgroundColor: '${activeConfig.backgroundColor}',\n      textColor: '${activeConfig.textColor}',\n      accentColor: '${activeConfig.accentColor}',\n      fontFamily: '${activeConfig.fontFamily}',\n      borderRadius: '${activeConfig.borderRadius}'\n    },\n    defaultView: '${activeConfig.defaultView}'${hiddenCats.length > 0 ? `,\n    hiddenCategories: ${JSON.stringify(hiddenCats)}` : ""}\n  });\n</script>`
    : "";

  const copyEmbed = () => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const connectOrg = async (orgId: string) => {
    if (!organization) return;
    await api.post(`/organizations/${organization.id}/connections`, { connectedOrgId: orgId });
    const org = allOrgs.find((o) => o.id === orgId);
    if (org) setConnections([...connections, { id: org.id, name: org.name, slug: org.slug }]);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 animate-fade-in">
      <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-gray-900">Embed Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Theme */}
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow"><Palette className="h-4 w-4 text-white" /></div>
              <h2 className="text-base font-bold text-gray-900">Theme</h2>
            </div>

            {activeConfig && (
              <div className="space-y-4">
                {[
                  { key: "primaryColor", label: "Primary Color" },
                  { key: "backgroundColor", label: "Background" },
                  { key: "textColor", label: "Text Color" },
                  { key: "accentColor", label: "Accent Color" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={String((activeConfig as unknown as Record<string, string>)[key])} onChange={(e) => updateConfig(key, e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5" />
                      <input type="text" value={String((activeConfig as unknown as Record<string, string>)[key])} onChange={(e) => updateConfig(key, e.target.value)} className="w-24 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 text-xs font-mono transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100" />
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Font Family</label>
                  <input type="text" value={activeConfig.fontFamily} onChange={(e) => updateConfig("fontFamily", e.target.value)} className="w-40 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100" />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Border Radius</label>
                  <input type="text" value={activeConfig.borderRadius} onChange={(e) => updateConfig("borderRadius", e.target.value)} className="w-24 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100" />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Default View</label>
                  <select value={activeConfig.defaultView} onChange={(e) => updateConfig("defaultView", e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100">
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="list">List</option>
                    <option value="poster">Poster Board</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Show Connected Orgs</label>
                  <button onClick={() => updateConfig("showConnectedOrgs", !activeConfig.showConnectedOrgs)} className={clsx("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", activeConfig.showConnectedOrgs ? "bg-primary-600" : "bg-gray-300")}>
                    <span className={clsx("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", activeConfig.showConnectedOrgs ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>

                <button onClick={saveConfig} disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50">
                  {saving ? "Saving..." : "Save Theme"}
                </button>
              </div>
            )}
          </div>

          {/* Category Visibility */}
          {allCategories.length > 0 && activeConfig && (
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Event Types</h2>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                Toggle off event types you don't want displayed in your embed. Visitors can also filter within the visible types.
              </p>
              <div className="space-y-2">
                {allCategories.map((cat) => {
                  const hidden = (activeConfig.categoryFilter ?? []).includes(cat.slug);
                  return (
                    <div key={cat.id} className="flex items-center justify-between rounded-xl bg-gray-50/80 px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-xs"
                          style={{
                            backgroundColor: cat.color ? `${cat.color}18` : "#4f46e518",
                            color: cat.color ?? "#4f46e5",
                          }}
                        >
                          {cat.icon ?? cat.name.charAt(0)}
                        </span>
                        <span className={clsx("text-sm font-semibold", hidden ? "text-gray-300 line-through" : "text-gray-900")}>
                          {cat.name}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const current = activeConfig.categoryFilter ?? [];
                          const updated = hidden
                            ? current.filter((s) => s !== cat.slug)
                            : [...current, cat.slug];
                          updateConfig("categoryFilter", updated);
                        }}
                        className={clsx(
                          "relative inline-flex h-6 w-10 items-center rounded-full transition-colors",
                          hidden ? "bg-gray-300" : "bg-emerald-500",
                        )}
                      >
                        <span className={clsx(
                          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                          hidden ? "translate-x-1" : "translate-x-5",
                        )} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connections */}
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow"><Link2 className="h-4 w-4 text-white" /></div>
              <h2 className="text-base font-bold text-gray-900">Connected Organizations</h2>
            </div>
            <p className="mb-4 text-sm text-gray-500">Events from connected organizations will also appear on your embedded calendar.</p>

            {connections.length > 0 ? (
              <ul className="mb-4 space-y-2">
                {connections.map((conn) => (
                  <li key={conn.id} className="flex items-center justify-between rounded-xl bg-gray-50/80 px-4 py-2.5">
                    <span className="text-sm font-bold text-gray-900">{conn.name}</span>
                    <Unlink className="h-4 w-4 cursor-pointer text-gray-300 transition-colors hover:text-red-500" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-gray-400">No connected organizations yet.</p>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Add Connection</label>
              <select className={inputCls} onChange={(e) => { if (e.target.value) connectOrg(e.target.value); e.target.value = ""; }} defaultValue="">
                <option value="" disabled>Select an organization...</option>
                {allOrgs.filter((o) => !connections.some((c) => c.id === o.id)).map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Embed Code & How to Install */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow"><Code2 className="h-4 w-4 text-white" /></div>
                <h2 className="text-base font-bold text-gray-900">Embed Code</h2>
              </div>
              <button onClick={copyEmbed} className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/60 px-3 py-1.5 text-sm font-semibold shadow-sm transition-all hover:bg-white hover:shadow">
                {copied ? (<><Check className="h-4 w-4 text-emerald-600" /><span className="text-emerald-600">Copied!</span></>) : (<><Copy className="h-4 w-4 text-gray-500" /><span className="text-gray-600">Copy</span></>)}
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-500">Paste this code into your website's HTML where you want the calendar to appear.</p>
            <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs text-emerald-400 max-h-80"><code>{embedCode}</code></pre>
          </div>

          <PlatformGuides embedCode={embedCode} />
        </div>
      </div>

      {/* Live Preview — full width below everything */}
      {activeConfig && <LivePreview config={activeConfig} orgId={organization?.id || ""} />}
    </div>
  );
}
