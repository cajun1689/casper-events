import type { EmbedEvent } from "./types";

export interface EmbedConfig {
  orgName: string;
  logoUrl: string | null;
  categories: { id: string; name: string; slug: string; icon: string | null; color: string | null }[];
}

export function createApiClient(apiUrl: string) {
  const base = apiUrl.replace(/\/+$/, "");

  async function fetchEvents(
    orgId: string,
    includeConnected: boolean,
  ): Promise<EmbedEvent[]> {
    const url = `${base}/embed/events/${orgId}?includeConnected=${includeConnected}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
    return res.json();
  }

  async function fetchConfig(orgId: string): Promise<EmbedConfig> {
    const url = `${base}/embed/config/${orgId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`);
    return res.json();
  }

  return { fetchEvents, fetchConfig };
}
