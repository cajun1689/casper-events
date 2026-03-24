import { create } from "zustand";
import type { CategoryPublic, OrganizationPublic } from "@cyh/shared";
import { safeGetToken, safeRemoveToken, safeSetToken } from "@/lib/safe-storage";

export type DatePreset = "all" | "today" | "tomorrow" | "weekend" | "next7";

interface AppState {
  token: string | null;
  user: { sub: string; email: string; name?: string; isAdmin?: boolean } | null;
  organization: { id: string; name: string; slug: string; status?: string } | null;
  categories: CategoryPublic[];
  selectedCategories: string[];
  viewMode: "month" | "week" | "list" | "poster" | "map";
  datePreset: DatePreset;
  selectedCity: string;
  selectedOrgIds: string[];
  organizations: OrganizationPublic[];

  setAuth: (token: string, user: AppState["user"], org: AppState["organization"]) => void;
  logout: () => void;
  setCategories: (cats: CategoryPublic[]) => void;
  toggleCategory: (slug: string) => void;
  clearCategoryFilter: () => void;
  setViewMode: (mode: "month" | "week" | "list" | "poster" | "map") => void;
  setDatePreset: (preset: DatePreset) => void;
  setSelectedCity: (city: string) => void;
  setOrganizations: (orgs: OrganizationPublic[]) => void;
  toggleOrgFilter: (orgId: string) => void;
  clearOrgFilter: () => void;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  try {
    const str = raw || "";
    if (!str || str === "null" || str === "undefined") return fallback;
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function safeLocalStorageGet(key: string, fallback: string): string {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) || fallback : fallback;
  } catch {
    return fallback;
  }
}

export const useStore = create<AppState>((set) => ({
  token: safeGetToken(),
  user: null,
  organization: null,
  categories: [],
  selectedCategories: [],
  viewMode: "month",
  datePreset: "all",
  selectedCity: safeLocalStorageGet("cyh_city", "All Wyoming"),
  selectedOrgIds: safeParseJson<string[]>(safeLocalStorageGet("cyh_org_filter", "[]"), []),
  organizations: [],

  setAuth: (token, user, organization) => {
    safeSetToken(token);
    set({ token, user, organization });
  },

  logout: () => {
    safeRemoveToken();
    set({ token: null, user: null, organization: null });
  },

  setCategories: (categories) => set({ categories }),

  toggleCategory: (slug) =>
    set((state) => {
      const selected = state.selectedCategories.includes(slug)
        ? state.selectedCategories.filter((s) => s !== slug)
        : [...state.selectedCategories, slug];
      return { selectedCategories: selected };
    }),

  clearCategoryFilter: () => set({ selectedCategories: [] }),

  setViewMode: (viewMode) => set({ viewMode }),
  setDatePreset: (datePreset) => set({ datePreset }),

  setSelectedCity: (city) => {
    try {
      if (typeof localStorage !== "undefined") {
        if (city === "All Wyoming") localStorage.removeItem("cyh_city");
        else localStorage.setItem("cyh_city", city);
      }
    } catch {
      // ignore
    }
    set({ selectedCity: city });
  },

  setOrganizations: (organizations) => set({ organizations }),

  toggleOrgFilter: (orgId) =>
    set((state) => {
      const selected = state.selectedOrgIds.includes(orgId)
        ? state.selectedOrgIds.filter((id) => id !== orgId)
        : [...state.selectedOrgIds, orgId];
      try {
        if (typeof localStorage !== "undefined") localStorage.setItem("cyh_org_filter", JSON.stringify(selected));
      } catch {
        // ignore
      }
      return { selectedOrgIds: selected };
    }),

  clearOrgFilter: () => {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem("cyh_org_filter");
    } catch {
      // ignore
    }
    set({ selectedOrgIds: [] });
  },
}));
