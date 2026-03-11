const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("cyh_token");
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

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
  OrgCategoryPublic,
} from "@cyh/shared";

export interface EventSponsor {
  id: string;
  eventId: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  level: "presenting" | "gold" | "silver" | "bronze" | "community";
  sortOrder: number;
  createdAt: string;
}

export interface RsvpResponse {
  count: number;
  userRsvped: boolean;
}

export const eventsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return api.get<PaginatedResponse<EventWithDetails>>(`/events${qs}`);
  },
  get: (id: string) => api.get<EventWithDetails>(`/events/${id}`),
  getRsvp: (id: string) => api.get<RsvpResponse>(`/events/${id}/rsvp`),
  rsvp: (id: string, body?: { email?: string }) =>
    api.post<RsvpResponse>(`/events/${id}/rsvp`, body ?? {}),
  create: (data: unknown) => api.post<EventWithDetails>("/events", data),
  update: (id: string, data: unknown) =>
    api.put<EventWithDetails>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  shareToFacebook: (id: string, body?: { message?: string; link?: string }) =>
    api.post<{ success: boolean; postId?: string }>(
      `/events/${id}/facebook/share`,
      body,
    ),
  getFacebookPreview: (id: string) =>
    api.get<{ message: string; link: string; eventUrl: string }>(
      `/events/${id}/facebook/preview`,
    ),
};

export const sponsorsApi = {
  list: (eventId: string) =>
    api.get<{ data: EventSponsor[] }>(`/events/${eventId}/sponsors`),
  create: (eventId: string, data: { name: string; logoUrl?: string | null; websiteUrl?: string | null; level?: string; sortOrder?: number }) =>
    api.post<EventSponsor>(`/events/${eventId}/sponsors`, data),
  update: (eventId: string, id: string, data: Partial<{ name: string; logoUrl: string | null; websiteUrl: string | null; level: string; sortOrder: number }>) =>
    api.put<EventSponsor>(`/events/${eventId}/sponsors/${id}`, data),
  delete: (eventId: string, id: string) =>
    api.delete(`/events/${eventId}/sponsors/${id}`),
  reorder: (eventId: string, order: { id: string; sortOrder: number }[]) =>
    api.put<{ data: EventSponsor[] }>(`/events/${eventId}/sponsors/reorder`, { order }),
};

export const categoriesApi = {
  list: () => api.get<{ data: CategoryPublic[] }>("/categories"),
};

export const orgCategoriesApi = {
  list: (orgId: string) =>
    api.get<{ data: (OrgCategoryPublic & { parentCategory?: CategoryPublic })[] }>(
      `/organizations/${orgId}/org-categories`,
    ),
  create: (orgId: string, data: { parentCategoryId: string; name: string; slug: string; icon?: string; color?: string; sortOrder?: number }) =>
    api.post<OrgCategoryPublic & { parentCategory?: CategoryPublic }>(
      `/organizations/${orgId}/org-categories`,
      data,
    ),
  update: (orgId: string, catId: string, data: Partial<{ name: string; slug: string; icon?: string; color?: string; sortOrder: number }>) =>
    api.put<OrgCategoryPublic>(`/organizations/${orgId}/org-categories/${catId}`, data),
  delete: (orgId: string, catId: string) =>
    api.delete(`/organizations/${orgId}/org-categories/${catId}`),
};

export const organizationsApi = {
  list: () => api.get<{ data: OrganizationPublic[] }>("/organizations"),
  get: (slug: string) => api.get<OrganizationPublic>(`/organizations/${slug}`),
};

export const authApi = {
  me: () => api.get<{ user: unknown; organization: unknown }>("/auth/me"),
  register: (data: unknown) => api.post("/auth/register", data),
  getBetaStatus: () =>
    api.get<{ requireInviteCode: boolean }>("/auth/beta-status"),
  validateInvite: (code: string) =>
    api.post<{ valid: boolean }>("/auth/validate-invite", { code }),
};

export const venuesApi = {
  search: (q: string) =>
    api.get<{ data: Array<{ id: string; name: string; address: string | null; latitude: number | null; longitude: number | null; usageCount: number }> }>(
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
  getSettings: () =>
    api.get<{ requireGoogleEventApproval: boolean }>("/google-calendar/settings"),
  setSettings: (requireGoogleEventApproval: boolean) =>
    api.put("/google-calendar/settings", { requireGoogleEventApproval }),
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

export const digestApi = {
  subscribe: (data: { email: string; categories?: string[] }) =>
    api.post<{ success: boolean; message: string }>("/digest/subscribe", data),
};

export const publicEventsApi = {
  submit: (data: {
    title: string;
    description?: string | null;
    startAt: string;
    endAt?: string | null;
    allDay?: boolean;
    venueName?: string | null;
    address?: string | null;
    cost?: string | null;
    ticketUrl?: string | null;
    categoryIds?: string[];
    submitterName: string;
    submitterEmail: string;
  }) => api.post<{ success: boolean; message: string; eventId: string }>("/public/events", data),
};

export interface DigestSubscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface DigestSettings {
  emailHeader: string;
  emailFooter: string;
  headerImageUrl: string;
  sponsors: { name: string; url: string; logoUrl?: string }[];
  extraLinks: { label: string; url: string }[];
  latestNews: { imageUrl: string; title: string; author: string; date: string; summary: string; url?: string }[];
}

export const digestAdminApi = {
  listSubscribers: () =>
    api.get<{ data: DigestSubscriber[] }>("/admin/digest/subscribers"),
  addSubscriber: (email: string) =>
    api.post<{ success: boolean; message: string }>("/admin/digest/subscribers", { email }),
  deleteSubscriber: (id: string) =>
    api.delete(`/admin/digest/subscribers/${id}`),
  exportSubscribers: async (): Promise<void> => {
    const token = localStorage.getItem("cyh_token");
    const res = await fetch(`${API_BASE}/admin/digest/subscribers/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "digest-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  },
  getSettings: () =>
    api.get<DigestSettings>("/admin/digest/settings"),
  updateSettings: (settings: DigestSettings) =>
    api.put<DigestSettings>("/admin/digest/settings", settings),
};

export const adminApi = {
  getBetaStatus: () =>
    api.get<{ requireInviteCode: boolean }>("/admin/beta-status"),
  setBetaStatus: (requireInviteCode: boolean) =>
    api.put("/admin/beta-status", { requireInviteCode }),
  listInviteCodes: () =>
    api.get<{
      data: Array<{
        id: string;
        code: string;
        createdAt: string;
        usedAt: string | null;
        usedByOrgId: string | null;
      }>;
    }>("/admin/invite-codes"),
  createInviteCode: (code?: string) =>
    api.post<{ id: string; code: string }>("/admin/invite-codes", { code }),
  pendingEvents: () =>
    api.get<{ data: EventWithDetails[] }>("/admin/events/pending"),
  reviewEvent: (id: string, data: { decision: string; notes?: string }) =>
    api.put(`/admin/events/${id}/review`, data),
  bulkReview: (data: {
    eventIds: string[];
    decision: string;
    notes?: string;
  }) => api.post("/admin/events/bulk-review", data),
  stats: () => api.get<{ events: Record<string, number>; organizations: number; digestSubscribers?: number }>("/admin/stats"),
  organizations: () =>
    api.get<{ data: OrganizationPublic[] }>("/admin/organizations"),
  updateOrgStatus: (id: string, status: string) =>
    api.put(`/admin/organizations/${id}/status`, { status }),
  createOrganization: (data: { orgName: string; orgSlug: string; contactName: string; contactEmail: string }) =>
    api.post<{ organization: OrganizationPublic; tempPassword: string }>(
      "/admin/organizations",
      data,
    ),
  updateOrganization: (id: string, data: { name?: string; slug?: string; logoUrl?: string | null; autoApprove?: boolean; communityHub?: boolean }) =>
    api.put<OrganizationPublic>(`/admin/organizations/${id}`, data),
};
