import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Code2, Palette, Copy, Check, Eye, Link2, Unlink, ArrowLeft, ChevronDown, Globe, RefreshCw, Filter, Layout, FileText, Type, Plus, CopyPlus } from "lucide-react";
import clsx from "clsx";

const COLOR_PRESETS: { name: string; primary: string; secondary: string; bg: string; text: string; accent: string; gradient?: string }[] = [
  { name: "Blue", primary: "#2563eb", secondary: "#64748b", bg: "#ffffff", text: "#1f2937", accent: "#f59e0b" },
  { name: "Green", primary: "#059669", secondary: "#64748b", bg: "#ffffff", text: "#1f2937", accent: "#f59e0b" },
  { name: "Purple", primary: "#7c3aed", secondary: "#64748b", bg: "#ffffff", text: "#1f2937", accent: "#f59e0b" },
  { name: "Slate", primary: "#475569", secondary: "#64748b", bg: "#f8fafc", text: "#1e293b", accent: "#0ea5e9" },
  { name: "Dark", primary: "#38bdf8", secondary: "#94a3b8", bg: "#0f172a", text: "#f1f5f9", accent: "#fbbf24" },
  { name: "Ocean", primary: "#0284c7", secondary: "#64748b", bg: "#f0f9ff", text: "#0c4a6e", accent: "#f59e0b", gradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" },
  { name: "Sunset", primary: "#dc2626", secondary: "#78716c", bg: "#fffbeb", text: "#44403c", accent: "#f97316", gradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" },
  { name: "Forest", primary: "#15803d", secondary: "#6b7280", bg: "#f0fdf4", text: "#14532d", accent: "#eab308", gradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" },
  { name: "Midnight", primary: "#818cf8", secondary: "#a1a1aa", bg: "#18181b", text: "#e4e4e7", accent: "#facc15", gradient: "linear-gradient(135deg, #18181b 0%, #27272a 100%)" },
  { name: "Rose", primary: "#e11d48", secondary: "#9ca3af", bg: "#fff1f2", text: "#4c0519", accent: "#f59e0b", gradient: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)" },
];

const FONT_PRESETS = [
  { name: "Match site", value: "inherit" },
  { name: "Inter", value: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' },
  { name: "System UI", value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { name: "Georgia", value: 'Georgia, "Times New Roman", serif' },
];

const BORDER_RADIUS_PRESETS = [
  { name: "None", value: "0" },
  { name: "Small", value: "4px" },
  { name: "Medium", value: "8px" },
  { name: "Large", value: "12px" },
  { name: "Pill", value: "999px" },
];

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/80 overflow-hidden shadow-sm backdrop-blur-sm">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
        </div>
        <ChevronDown className={clsx("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-6 pb-6 pt-0">{children}</div>}
    </div>
  );
}
import { useStore } from "@/lib/store";
import { api, categoriesApi, orgCategoriesApi } from "@/lib/api";
import type { EmbedConfigPublic, OrganizationPublic, CategoryPublic, OrgCategoryPublic } from "@cyh/shared";
import { ICON_BANK } from "@cyh/shared";
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

function OrgCategoryManager({
  orgId,
  parentCategories,
  orgCategories,
  iconBank,
  onUpdate,
}: {
  orgId: string;
  parentCategories: CategoryPublic[];
  orgCategories: (OrgCategoryPublic & { parentCategory?: CategoryPublic })[];
  iconBank: readonly string[];
  onUpdate: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newParentId, setNewParentId] = useState(parentCategories[0]?.id ?? "");
  const [newIcon, setNewIcon] = useState(iconBank[0] ?? "");
  const [newColor, setNewColor] = useState("#4f46e5");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await orgCategoriesApi.create(orgId, {
        parentCategoryId: newParentId,
        name: newName.trim(),
        slug: newSlug.trim() || slugify(newName),
        icon: newIcon || undefined,
        color: newColor,
      });
      setCreating(false);
      setNewName("");
      setNewSlug("");
      onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (catId: string) => {
    if (!confirm("Delete this sub-category?")) return;
    try {
      await orgCategoriesApi.delete(orgId, catId);
      onUpdate();
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  return (
    <div className="space-y-4">
      {orgCategories.length > 0 && (
        <ul className="space-y-2">
          {orgCategories.map((oc) => {
            const parent = parentCategories.find((p) => p.id === oc.parentCategoryId);
            return (
              <li key={oc.id} className="flex items-center justify-between rounded-xl bg-gray-50/80 px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs" style={{ backgroundColor: (oc.color ?? "#4f46e5") + "18", color: oc.color ?? "#4f46e5" }}>
                    {oc.icon ?? oc.name.charAt(0)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{oc.name}</span>
                  {parent && <span className="text-xs text-gray-400">under {parent.name}</span>}
                </div>
                <button onClick={() => handleDelete(oc.id)} className="text-xs font-semibold text-red-500 hover:underline">
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {creating ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
          <input
            placeholder="Name (e.g. Kids Soccer)"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (!newSlug) setNewSlug(slugify(e.target.value));
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input placeholder="Slug (auto-generated)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono" />
          <select value={newParentId} onChange={(e) => setNewParentId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
            {parentCategories.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">Icon</p>
            <div className="flex flex-wrap gap-1">
              {iconBank.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={clsx("h-8 w-8 rounded-lg border-2 text-lg transition-all", newIcon === icon ? "border-primary-500 scale-110" : "border-gray-200 hover:border-gray-300")}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border" />
            <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs font-mono" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? "Creating…" : "Create"}
            </button>
            <button onClick={() => setCreating(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} className="rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 transition-all">
          + Add sub-category
        </button>
      )}
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
      ctaOpensExternal: config.ctaOpensExternal ?? false,
      theme: {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
        accentColor: config.accentColor,
        fontFamily: config.fontFamily,
        borderRadius: config.borderRadius,
        borderColor: config.borderColor ?? undefined,
        headerBgColor: config.headerBgColor ?? undefined,
        linkColor: config.linkColor ?? undefined,
        backgroundGradient: config.backgroundGradient ?? undefined,
        boxShadow: (config.boxShadow ?? "subtle") as "none" | "subtle" | "medium",
      },
      defaultView: config.defaultView as "month" | "week" | "list" | "poster",
      hiddenCategories: config.categoryFilter ?? [],
      categoryDisplayMode: config.categoryDisplayMode ?? {},
      layoutDensity: (config.layoutDensity ?? "comfortable") as "compact" | "comfortable",
      firstDayOfWeek: (config.firstDayOfWeek ?? "sunday") as "sunday" | "monday",
      timeFormat: (config.timeFormat ?? "12h") as "12h" | "24h",
      maxEventsShown: config.maxEventsShown ?? undefined,
      showEventImages: config.showEventImages ?? true,
      showVenue: config.showVenue ?? true,
      showOrganizer: config.showOrganizer ?? true,
      showCategories: config.showCategories ?? true,
      showTicketLink: config.showTicketLink ?? true,
      showCost: config.showCost ?? true,
      headerTitle: config.headerTitle ?? "Events",
      showHeader: config.showHeader ?? true,
      showPoweredBy: config.showPoweredBy ?? true,
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
  const [orgCategories, setOrgCategories] = useState<(OrgCategoryPublic & { parentCategory?: CategoryPublic })[]>([]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!organization) return;
    Promise.all([
      api.get<{ data: EmbedConfigPublic[] }>(`/embed/config/${organization.id}`),
      api.get<{ data: { id: string; name: string; slug: string }[] }>(`/organizations/${organization.id}/connections`),
      api.get<{ data: OrganizationPublic[] }>("/organizations"),
      categoriesApi.list(),
      orgCategoriesApi.list(organization.id),
    ]).then(([configRes, connRes, orgsRes, catsRes, orgCatsRes]) => {
      setConfigs(configRes.data);
      if (configRes.data.length > 0) setActiveConfig(configRes.data[0]);
      setConnections(connRes.data);
      setAllOrgs(orgsRes.data.filter((o) => o.id !== organization.id));
      setAllCategories(catsRes.data);
      setOrgCategories(orgCatsRes.data);
      setLoading(false);
    });
  }, [token, organization, navigate]);

  const updateConfig = useCallback(
    (field: string, value: string | boolean | string[] | number | null | Record<string, "parent" | "subs" | "both">) => {
      setActiveConfig((prev) => prev ? { ...prev, [field]: value } as EmbedConfigPublic : prev);
    },
    [],
  );

  const setCategoryDisplayMode = useCallback(
    (parentSlug: string, mode: "parent" | "subs" | "both") => {
      setActiveConfig((prev) => {
        if (!prev) return prev;
        const current = prev.categoryDisplayMode ?? {};
        return { ...prev, categoryDisplayMode: { ...current, [parentSlug]: mode } } as EmbedConfigPublic;
      });
    },
    [],
  );

  const applyPreset = useCallback(
    (fields: Partial<Record<string, string | boolean | number | null>>) => {
      setActiveConfig((prev) => prev ? { ...prev, ...fields } as EmbedConfigPublic : prev);
    },
    [],
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

  const buildEmbedCode = (c: EmbedConfigPublic) => {
    const hiddenCats = c.categoryFilter?.length ? c.categoryFilter : [];
    const theme: Record<string, string> = {
      primaryColor: c.primaryColor,
      secondaryColor: c.secondaryColor ?? "#64748b",
      backgroundColor: c.backgroundColor,
      textColor: c.textColor,
      accentColor: c.accentColor,
      fontFamily: c.fontFamily,
      borderRadius: c.borderRadius,
    };
    if (c.borderColor) theme.borderColor = c.borderColor;
    if (c.headerBgColor) theme.headerBgColor = c.headerBgColor;
    if (c.linkColor) theme.linkColor = c.linkColor;
    if (c.backgroundGradient) theme.backgroundGradient = c.backgroundGradient;
    if (c.boxShadow && c.boxShadow !== "subtle") theme.boxShadow = c.boxShadow;
    const themeStr = Object.entries(theme)
      .map(([k, v]) => `      ${k}: '${String(v).replace(/'/g, "\\'")}'`)
      .join(",\n");
    const opts: string[] = [
      `    container: '#cyh-calendar'`,
      `    orgId: '${organization?.id}'`,
      `    showConnectedOrgs: ${c.showConnectedOrgs}`,
      `    ctaOpensExternal: ${c.ctaOpensExternal ?? false}`,
      `    theme: {\n${themeStr}\n    }`,
      `    defaultView: '${c.defaultView}'`,
    ];
    if (hiddenCats.length > 0) opts.push(`    hiddenCategories: ${JSON.stringify(hiddenCats)}`);
    const displayMode = c.categoryDisplayMode && Object.keys(c.categoryDisplayMode).length > 0 ? c.categoryDisplayMode : undefined;
    if (displayMode) opts.push(`    categoryDisplayMode: ${JSON.stringify(displayMode)}`);
    if (c.layoutDensity && c.layoutDensity !== "comfortable") opts.push(`    layoutDensity: '${c.layoutDensity}'`);
    if (c.firstDayOfWeek && c.firstDayOfWeek !== "sunday") opts.push(`    firstDayOfWeek: '${c.firstDayOfWeek}'`);
    if (c.timeFormat && c.timeFormat !== "12h") opts.push(`    timeFormat: '${c.timeFormat}'`);
    if (c.maxEventsShown != null) opts.push(`    maxEventsShown: ${c.maxEventsShown}`);
    if (c.showEventImages === false) opts.push(`    showEventImages: false`);
    if (c.showVenue === false) opts.push(`    showVenue: false`);
    if (c.showOrganizer === false) opts.push(`    showOrganizer: false`);
    if (c.showCategories === false) opts.push(`    showCategories: false`);
    if (c.showTicketLink === false) opts.push(`    showTicketLink: false`);
    if (c.showCost === false) opts.push(`    showCost: false`);
    if (c.headerTitle && c.headerTitle !== "Events") opts.push(`    headerTitle: '${String(c.headerTitle).replace(/'/g, "\\'")}'`);
    if (c.showHeader === false) opts.push(`    showHeader: false`);
    if (c.showPoweredBy === false) opts.push(`    showPoweredBy: false`);
    return `<div id="cyh-calendar"></div>\n<script src="https://casperevents.org/embed.js"></script>\n<script>\n  CYHCalendar.init({\n${opts.join(",\n")}\n  });\n</script>`;
  };
  const embedCode = activeConfig ? buildEmbedCode(activeConfig) : "";

  const copyEmbed = () => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const createNewConfig = async () => {
    if (!organization) return;
    try {
      const base = activeConfig ? (() => { const { id: _i, orgId: _o, ...r } = activeConfig; return r; })() : undefined;
      const created = await api.post<EmbedConfigPublic>(`/embed/config`, {
        ...base,
        label: `Config ${configs.length + 1}`,
      });
      setConfigs([...configs, created]);
      setActiveConfig(created);
    } catch (e) {
      console.error("Failed to create config", e);
    }
  };

  const duplicateConfig = async () => {
    if (!activeConfig || !organization) return;
    try {
      const { id: _id, orgId: _orgId, ...rest } = activeConfig;
      const created = await api.post<EmbedConfigPublic>(`/embed/config`, {
        ...rest,
        label: `${activeConfig.label} (copy)`,
      });
      setConfigs([...configs, created]);
      setActiveConfig(created);
    } catch (e) {
      console.error("Failed to duplicate config", e);
    }
  };

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

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Embed Settings</h1>
        <div className="flex flex-wrap items-center gap-3">
          {configs.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Config:</label>
              <select
                value={activeConfig?.id ?? ""}
                onChange={(e) => {
                  const c = configs.find((x) => x.id === e.target.value);
                  if (c) setActiveConfig(c);
                }}
                className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm font-medium transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100"
              >
                {configs.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={duplicateConfig}
            disabled={!activeConfig}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            <CopyPlus className="h-4 w-4" />
            Duplicate
          </button>
          <button
            onClick={createNewConfig}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-100"
          >
            <Plus className="h-4 w-4" />
            New config
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {activeConfig && (
            <>
          {/* Theme */}
          <CollapsibleSection title="Theme" icon={Palette}>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Color presets</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset({
                        primaryColor: p.primary,
                        secondaryColor: p.secondary,
                        backgroundColor: p.bg,
                        textColor: p.text,
                        accentColor: p.accent,
                        backgroundGradient: p.gradient ?? "",
                      })}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold transition-all hover:border-primary-300 hover:bg-primary-50"
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-gray-300"
                        style={{ background: p.gradient ?? p.primary }}
                      />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { key: "primaryColor", label: "Primary" },
                { key: "secondaryColor", label: "Secondary" },
                { key: "backgroundColor", label: "Background" },
                { key: "textColor", label: "Text" },
                { key: "accentColor", label: "Accent" },
                { key: "borderColor", label: "Border (optional)" },
                { key: "headerBgColor", label: "Header bg (optional)" },
                { key: "linkColor", label: "Link (optional)" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <label className="text-sm font-semibold text-gray-700 shrink-0">{label}</label>
                  <div className="flex items-center gap-2">
                    {!label.includes("optional") && (
                      <input type="color" value={String((activeConfig as unknown as Record<string, string>)[key] ?? "#000000")} onChange={(e) => updateConfig(key, e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5" />
                    )}
                    <input type="text" value={String((activeConfig as unknown as Record<string, string>)[key] ?? "")} onChange={(e) => updateConfig(key, e.target.value)} placeholder={label.includes("optional") ? "inherit" : ""} className="w-24 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 text-xs font-mono transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100" />
                  </div>
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Background gradient (optional)</label>
                <input
                  type="text"
                  value={(activeConfig as unknown as Record<string, string>).backgroundGradient ?? ""}
                  onChange={(e) => updateConfig("backgroundGradient", e.target.value)}
                  placeholder="e.g. linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-mono transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
                <p className="mt-1 text-xs text-gray-400">Overrides background color with a CSS gradient. Leave empty for solid color.</p>
                {(activeConfig as unknown as Record<string, string>).backgroundGradient && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-6 w-full rounded-lg border border-gray-200" style={{ background: (activeConfig as unknown as Record<string, string>).backgroundGradient }} />
                    <button onClick={() => updateConfig("backgroundGradient", "")} className="shrink-0 text-xs font-semibold text-red-500 hover:underline">Clear</button>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Font presets</label>
                <select value={FONT_PRESETS.some((f) => f.value === activeConfig.fontFamily) ? activeConfig.fontFamily : "custom"} onChange={(e) => e.target.value !== "custom" && updateConfig("fontFamily", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100">
                  {FONT_PRESETS.map((f) => (
                    <option key={f.value} value={f.value}>{f.name}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                <input type="text" value={activeConfig.fontFamily} onChange={(e) => updateConfig("fontFamily", e.target.value)} placeholder="CSS font-family" className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Border radius</label>
                <div className="flex flex-wrap gap-2">
                  {BORDER_RADIUS_PRESETS.map((p) => (
                    <button key={p.value} onClick={() => updateConfig("borderRadius", p.value)} className={clsx("rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all", activeConfig.borderRadius === p.value ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 hover:border-gray-300")}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Box shadow</label>
                <select value={activeConfig.boxShadow ?? "subtle"} onChange={(e) => updateConfig("boxShadow", e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100">
                  <option value="none">None</option>
                  <option value="subtle">Subtle</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Default view</label>
                <select value={activeConfig.defaultView} onChange={(e) => updateConfig("defaultView", e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100">
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                  <option value="list">List</option>
                  <option value="poster">Poster Board</option>
                </select>
              </div>
            </div>
          </CollapsibleSection>

          {/* Layout */}
          <CollapsibleSection title="Layout" icon={Layout} defaultOpen={false}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Layout density</label>
                <select value={activeConfig.layoutDensity ?? "comfortable"} onChange={(e) => updateConfig("layoutDensity", e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100">
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">First day of week</label>
                <select value={activeConfig.firstDayOfWeek ?? "sunday"} onChange={(e) => updateConfig("firstDayOfWeek", e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100">
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Time format</label>
                <select value={activeConfig.timeFormat ?? "12h"} onChange={(e) => updateConfig("timeFormat", e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100">
                  <option value="12h">12-hour</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Max events (list/poster)</label>
                <input type="number" min={1} max={500} value={activeConfig.maxEventsShown ?? ""} onChange={(e) => updateConfig("maxEventsShown", e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="All" className="w-24 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100" />
              </div>
            </div>
          </CollapsibleSection>

          {/* Content */}
          <CollapsibleSection title="Content" icon={FileText} defaultOpen={false}>
            <div className="space-y-3">
              {[
                { key: "showEventImages", label: "Show event images" },
                { key: "showVenue", label: "Show venue/address" },
                { key: "showOrganizer", label: "Show organizer" },
                { key: "showCategories", label: "Show category badges" },
                { key: "showTicketLink", label: "Show ticket link" },
                { key: "showCost", label: "Show cost" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">{label}</label>
                  <button onClick={() => updateConfig(key, !(activeConfig as unknown as Record<string, boolean>)[key])} className={clsx("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", (activeConfig as unknown as Record<string, boolean>)[key] !== false ? "bg-primary-600" : "bg-gray-300")}>
                    <span className={clsx("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", (activeConfig as unknown as Record<string, boolean>)[key] !== false ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Header & Footer */}
          <CollapsibleSection title="Header & Footer" icon={Type} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Header title</label>
                <input type="text" value={activeConfig.headerTitle ?? "Events"} onChange={(e) => updateConfig("headerTitle", e.target.value)} placeholder="Events" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Show header</label>
                <button onClick={() => updateConfig("showHeader", !(activeConfig.showHeader ?? true))} className={clsx("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", (activeConfig.showHeader ?? true) ? "bg-primary-600" : "bg-gray-300")}>
                  <span className={clsx("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", (activeConfig.showHeader ?? true) ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Show &quot;Powered by Casper Events&quot;</label>
                <button onClick={() => updateConfig("showPoweredBy", !(activeConfig.showPoweredBy ?? true))} className={clsx("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", (activeConfig.showPoweredBy ?? true) ? "bg-primary-600" : "bg-gray-300")}>
                  <span className={clsx("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", (activeConfig.showPoweredBy ?? true) ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Connections & Behavior */}
          <CollapsibleSection title="Connections & Behavior" icon={Link2} defaultOpen={false}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Show connected orgs</label>
                <button onClick={() => updateConfig("showConnectedOrgs", !activeConfig.showConnectedOrgs)} className={clsx("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", activeConfig.showConnectedOrgs ? "bg-primary-600" : "bg-gray-300")}>
                  <span className={clsx("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", activeConfig.showConnectedOrgs ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700" title="When on, poster CTA opens external link directly. When off, click goes to event detail.">
                  Poster CTA opens external link
                </label>
                <button onClick={() => updateConfig("ctaOpensExternal", !(activeConfig.ctaOpensExternal ?? false))} className={clsx("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", (activeConfig.ctaOpensExternal ?? false) ? "bg-primary-600" : "bg-gray-300")}>
                  <span className={clsx("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", (activeConfig.ctaOpensExternal ?? false) ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>
            </div>
          </CollapsibleSection>

          <button onClick={saveConfig} disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50">
            {saving ? "Saving..." : "Save All Settings"}
          </button>
            </>
          )}

          {/* Org Sub-Categories */}
          {organization && allCategories.length > 0 && activeConfig && (
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Custom Event Types (Sub-Categories)</h2>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                Create sub-categories under the main event types. Use these for your embed filters and when creating events.
              </p>
              <OrgCategoryManager
                orgId={organization.id}
                parentCategories={allCategories}
                orgCategories={orgCategories}
                iconBank={ICON_BANK}
                onUpdate={() => orgCategoriesApi.list(organization.id).then((r) => setOrgCategories(r.data))}
              />
            </div>
          )}

          {/* Category Visibility & Display Mode */}
          {allCategories.length > 0 && activeConfig && (
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Event Types</h2>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                Toggle off event types you don&apos;t want displayed. For visible types, choose whether to show the parent, your sub-categories only, or both.
              </p>
              <div className="space-y-2">
                {allCategories.map((cat) => {
                  const hidden = (activeConfig.categoryFilter ?? []).includes(cat.slug);
                  const hasSubs = orgCategories.some((oc) => oc.parentCategoryId === cat.id);
                  const displayMode = (activeConfig.categoryDisplayMode ?? {})[cat.slug] ?? "both";
                  return (
                    <div key={cat.id} className="rounded-xl bg-gray-50/80 px-4 py-2.5 space-y-2">
                      <div className="flex items-center justify-between">
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
                          {hasSubs && <span className="text-[10px] text-gray-400">({orgCategories.filter((oc) => oc.parentCategoryId === cat.id).length} subs)</span>}
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
                            "relative inline-flex h-6 w-10 items-center rounded-full transition-colors shrink-0",
                            hidden ? "bg-gray-300" : "bg-emerald-500",
                          )}
                        >
                          <span className={clsx(
                            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                            hidden ? "translate-x-1" : "translate-x-5",
                          )} />
                        </button>
                      </div>
                      {!hidden && hasSubs && (
                        <div className="flex flex-wrap gap-2 pl-8">
                          {(["parent", "subs", "both"] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setCategoryDisplayMode(cat.slug, mode)}
                              className={clsx(
                                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                                displayMode === mode
                                  ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                                  : "bg-white/80 text-gray-500 hover:bg-gray-100",
                              )}
                            >
                              {mode === "parent" ? "Parent only" : mode === "subs" ? "Subs only" : "Both"}
                            </button>
                          ))}
                        </div>
                      )}
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
