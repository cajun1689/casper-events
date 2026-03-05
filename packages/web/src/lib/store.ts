import { create } from "zustand";
import type { CategoryPublic } from "@cyh/shared";

interface AppState {
  token: string | null;
  user: { sub: string; email: string; name?: string; isAdmin?: boolean } | null;
  organization: { id: string; name: string; slug: string } | null;
  categories: CategoryPublic[];
  selectedCategories: string[];
  viewMode: "month" | "week" | "list";

  setAuth: (token: string, user: AppState["user"], org: AppState["organization"]) => void;
  logout: () => void;
  setCategories: (cats: CategoryPublic[]) => void;
  toggleCategory: (slug: string) => void;
  clearCategoryFilter: () => void;
  setViewMode: (mode: "month" | "week" | "list") => void;
}

export const useStore = create<AppState>((set) => ({
  token: localStorage.getItem("cyh_token"),
  user: null,
  organization: null,
  categories: [],
  selectedCategories: [],
  viewMode: "month",

  setAuth: (token, user, organization) => {
    localStorage.setItem("cyh_token", token);
    set({ token, user, organization });
  },

  logout: () => {
    localStorage.removeItem("cyh_token");
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
}));
