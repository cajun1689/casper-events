import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  Palette,
  Copy,
  Check,
  Eye,
  Plus,
  Link2,
  Unlink,
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { EmbedConfigPublic, OrganizationPublic } from "@cyh/shared";

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

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!organization) return;

    Promise.all([
      api.get<{ data: EmbedConfigPublic[] }>(`/embed/config/${organization.id}`),
      api.get<{ data: { id: string; name: string; slug: string }[] }>(
        `/organizations/${organization.id}/connections`
      ),
      api.get<{ data: OrganizationPublic[] }>("/organizations"),
    ]).then(([configRes, connRes, orgsRes]) => {
      setConfigs(configRes.data);
      if (configRes.data.length > 0) setActiveConfig(configRes.data[0]);
      setConnections(connRes.data);
      setAllOrgs(orgsRes.data.filter((o) => o.id !== organization.id));
      setLoading(false);
    });
  }, [token, organization, navigate]);

  const updateConfig = useCallback(
    async (field: string, value: string | boolean | string[]) => {
      if (!activeConfig) return;
      const updated = { ...activeConfig, [field]: value } as EmbedConfigPublic;
      setActiveConfig(updated);
    },
    [activeConfig]
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

  const embedCode = activeConfig
    ? `<div id="cyh-calendar"></div>
<script src="${window.location.origin}/embed.js"></script>
<script>
  CYHCalendar.init({
    container: '#cyh-calendar',
    orgId: '${organization?.id}',
    showConnectedOrgs: ${activeConfig.showConnectedOrgs},
    theme: {
      primaryColor: '${activeConfig.primaryColor}',
      backgroundColor: '${activeConfig.backgroundColor}',
      textColor: '${activeConfig.textColor}',
      accentColor: '${activeConfig.accentColor}',
      fontFamily: '${activeConfig.fontFamily}',
      borderRadius: '${activeConfig.borderRadius}'
    },
    defaultView: '${activeConfig.defaultView}'
  });
</script>`
    : "";

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectOrg = async (orgId: string) => {
    if (!organization) return;
    await api.post(`/organizations/${organization.id}/connections`, {
      connectedOrgId: orgId,
    });
    const org = allOrgs.find((o) => o.id === orgId);
    if (org) {
      setConnections([...connections, { id: org.id, name: org.name, slug: org.slug }]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Embed Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Configuration */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Theme</h2>
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
                    <label className="text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={String((activeConfig as unknown as Record<string, string>)[key])}
                        onChange={(e) => updateConfig(key, e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={String((activeConfig as unknown as Record<string, string>)[key])}
                        onChange={(e) => updateConfig(key, e.target.value)}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md font-mono"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Font Family
                  </label>
                  <input
                    type="text"
                    value={activeConfig.fontFamily}
                    onChange={(e) => updateConfig("fontFamily", e.target.value)}
                    className="w-40 px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Border Radius
                  </label>
                  <input
                    type="text"
                    value={activeConfig.borderRadius}
                    onChange={(e) =>
                      updateConfig("borderRadius", e.target.value)
                    }
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Default View
                  </label>
                  <select
                    value={activeConfig.defaultView}
                    onChange={(e) =>
                      updateConfig("defaultView", e.target.value)
                    }
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="list">List</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Show Connected Orgs
                  </label>
                  <button
                    onClick={() =>
                      updateConfig(
                        "showConnectedOrgs",
                        !activeConfig.showConnectedOrgs
                      )
                    }
                    className={clsx(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      activeConfig.showConnectedOrgs
                        ? "bg-blue-600"
                        : "bg-gray-300"
                    )}
                  >
                    <span
                      className={clsx(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        activeConfig.showConnectedOrgs
                          ? "translate-x-6"
                          : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? "Saving..." : "Save Theme"}
                </button>
              </div>
            )}
          </div>

          {/* Connections */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Connected Organizations
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Events from connected organizations will also appear on your
              embedded calendar.
            </p>

            {connections.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {connections.map((conn) => (
                  <li
                    key={conn.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {conn.name}
                    </span>
                    <Unlink className="h-4 w-4 text-gray-400 cursor-pointer hover:text-red-500" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 mb-4">
                No connected organizations yet.
              </p>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Add Connection
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  onChange={(e) => {
                    if (e.target.value) connectOrg(e.target.value);
                    e.target.value = "";
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select an organization...
                  </option>
                  {allOrgs
                    .filter(
                      (o) => !connections.some((c) => c.id === o.id)
                    )
                    .map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Embed Code & Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Embed Code
                </h2>
              </div>
              <button
                onClick={copyEmbed}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-gray-600" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Paste this code into your website's HTML where you want the
              calendar to appear.
            </p>
            <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto max-h-80">
              <code>{embedCode}</code>
            </pre>
          </div>

          {/* Live Preview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Preview
              </h2>
            </div>
            {activeConfig && (
              <div
                className="border border-gray-200 rounded-lg p-4 min-h-[300px]"
                style={{
                  backgroundColor: activeConfig.backgroundColor,
                  color: activeConfig.textColor,
                  fontFamily: activeConfig.fontFamily,
                  borderRadius: activeConfig.borderRadius,
                }}
              >
                <div className="text-center py-8">
                  <p
                    className="text-lg font-semibold mb-2"
                    style={{ color: activeConfig.primaryColor }}
                  >
                    Calendar Preview
                  </p>
                  <p className="text-sm opacity-70">
                    Your embedded calendar will appear here with the theme
                    colors shown above. Deploy to see the live widget.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span
                      className="inline-block w-8 h-8 rounded-full"
                      style={{ backgroundColor: activeConfig.primaryColor }}
                    />
                    <span
                      className="inline-block w-8 h-8 rounded-full"
                      style={{ backgroundColor: activeConfig.accentColor }}
                    />
                    <span
                      className="inline-block w-8 h-8 rounded-full"
                      style={{ backgroundColor: activeConfig.secondaryColor }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
