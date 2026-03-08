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
    const json = await res.json();
    const data = json.data ?? json;
    return Array.isArray(data) ? data : [];
  }

  async function fetchConfig(orgId: string): Promise<EmbedConfig> {
    const url = `${base}/embed/config/${orgId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`);
    const json = await res.json();
    return json.data ?? json;
  }

  async function fetchRsvp(eventId: string): Promise<{ count: number; userRsvped: boolean }> {
    const res = await fetch(`${base}/events/${eventId}/rsvp`);
    if (!res.ok) throw new Error(`Failed to fetch RSVP: ${res.status}`);
    return res.json();
  }

  async function rsvp(eventId: string, email?: string): Promise<{ count: number; userRsvped: boolean }> {
    const res = await fetch(`${base}/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email ? { email } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to RSVP: ${res.status}`);
    }
    return res.json();
  }

  return { fetchEvents, fetchConfig, fetchRsvp, rsvp };
}
