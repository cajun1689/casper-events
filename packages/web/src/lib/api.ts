const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("cyh_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ── Typed API calls ─────────────────────────────────────────

import type {
  EventWithDetails,
  PaginatedResponse,
  CategoryPublic,
  OrganizationPublic,
} from "@cyh/shared";

export const eventsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return api.get<PaginatedResponse<EventWithDetails>>(`/events${qs}`);
  },
  get: (id: string) => api.get<EventWithDetails>(`/events/${id}`),
  create: (data: unknown) => api.post<EventWithDetails>("/events", data),
  update: (id: string, data: unknown) =>
    api.put<EventWithDetails>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  shareToFacebook: (id: string) =>
    api.post<{ success: boolean; postId?: string }>(
      `/events/${id}/facebook/share`
    ),
};

export const categoriesApi = {
  list: () => api.get<{ data: CategoryPublic[] }>("/categories"),
};

export const organizationsApi = {
  list: () => api.get<{ data: OrganizationPublic[] }>("/organizations"),
  get: (slug: string) => api.get<OrganizationPublic>(`/organizations/${slug}`),
};

export const authApi = {
  me: () => api.get<{ user: unknown; organization: unknown }>("/auth/me"),
  register: (data: unknown) => api.post("/auth/register", data),
};

export const venuesApi = {
  search: (q: string) =>
    api.get<{ data: Array<{ id: string; name: string; address: string | null; usageCount: number }> }>(
      `/venues?q=${encodeURIComponent(q)}`,
    ),
};

export const uploadApi = {
  getPresignedUrl: (filename: string, contentType: string, fileSize: number, folder?: string) =>
    api.post<{ uploadUrl: string; publicUrl: string; key: string }>(
      "/upload/presign",
      { filename, contentType, fileSize, folder },
    ),

  uploadFile: async (file: File, folder?: string): Promise<string> => {
    const { uploadUrl, publicUrl } = await uploadApi.getPresignedUrl(
      file.name,
      file.type,
      file.size,
      folder,
    );
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    return publicUrl;
  },
};

export const googleCalendarApi = {
  status: () =>
    api.get<{ connected: boolean; calendarId: string | null }>(
      "/google-calendar/status"
    ),
  calendars: () =>
    api.get<{
      calendars: { id: string; name: string; primary: boolean; color: string | null }[];
      selectedCalendarId: string | null;
    }>("/google-calendar/calendars"),
  selectCalendar: (calendarId: string) =>
    api.put<{ success: boolean }>("/google-calendar/calendar", { calendarId }),
  sync: () => api.post<{ success: boolean }>("/google-calendar/sync"),
  disconnect: () => api.delete("/google-calendar/disconnect"),
};

export const adminApi = {
  pendingEvents: () =>
    api.get<{ data: EventWithDetails[] }>("/admin/events/pending"),
  reviewEvent: (id: string, data: { decision: string; notes?: string }) =>
    api.put(`/admin/events/${id}/review`, data),
  bulkReview: (data: {
    eventIds: string[];
    decision: string;
    notes?: string;
  }) => api.post("/admin/events/bulk-review", data),
  stats: () => api.get<{ events: Record<string, number>; organizations: number }>("/admin/stats"),
  organizations: () =>
    api.get<{ data: OrganizationPublic[] }>("/admin/organizations"),
  updateOrgStatus: (id: string, status: string) =>
    api.put(`/admin/organizations/${id}/status`, { status }),
  createOrganization: (data: { orgName: string; orgSlug: string; contactName: string; contactEmail: string }) =>
    api.post<{ organization: OrganizationPublic; tempPassword: string }>(
      "/admin/organizations",
      data,
    ),
  updateOrganization: (id: string, data: { name?: string; slug?: string; logoUrl?: string | null }) =>
    api.put<OrganizationPublic>(`/admin/organizations/${id}`, data),
};
