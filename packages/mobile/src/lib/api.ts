import { API_BASE } from "./constants";
import type {
  EventWithDetails,
  PaginatedResponse,
  OrganizationPublic,
} from "@cyh/shared";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        (body as { message?: string }).message ||
        `API error: ${res.status}`
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body ?? {}),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const eventsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return api.get<PaginatedResponse<EventWithDetails>>(`/events${qs}`);
  },
  get: (id: string) =>
    api.get<EventWithDetails>(`/events/${id}`),
};

export const organizationsApi = {
  list: () =>
    api.get<{ data: OrganizationPublic[] }>("/organizations"),
  get: (slug: string) =>
    api.get<OrganizationPublic>(`/organizations/${slug}`),
};

export const pushApi = {
  register: (token: string, platform: "ios" | "android") =>
    api.post("/push/register", { token, platform }),
  setOrgs: (token: string, orgIds: string[]) =>
    api.put("/push/orgs", { token, orgIds }),
  getOrgs: (token: string) =>
    api.get<{ orgIds: string[] }>(`/push/orgs?token=${encodeURIComponent(token)}`),
  unregister: async (token: string) => {
    await fetch(
      `${API_BASE}/push/unregister?token=${encodeURIComponent(token)}`,
      { method: "DELETE" }
    );
  },
};
