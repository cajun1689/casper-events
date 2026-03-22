import { create } from "zustand";
import type { CategoryPublic } from "@cyh/shared";
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

  setAuth: (token: string, user: AppState["user"], org: AppState["organization"]) => void;
  logout: () => void;
  setCategories: (cats: CategoryPublic[]) => void;
  toggleCategory: (slug: string) => void;
  clearCategoryFilter: () => void;
  setViewMode: (mode: "month" | "week" | "list" | "poster" | "map") => void;
  setDatePreset: (preset: DatePreset) => void;
}

export const useStore = create<AppState>((set) => ({
  token: safeGetToken(),
  user: null,
  organization: null,
  categories: [],
  selectedCategories: [],
  viewMode: "month",
  datePreset: "all",

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
}));
