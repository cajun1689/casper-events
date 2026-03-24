import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  EventWithDetails,
  CategoryPublic,
  OrganizationPublic,
} from "@cyh/shared";

export interface AppState {
  token: string | null;
  user: unknown | null;
  organization: unknown | null;

  categories: CategoryPublic[];
  selectedCity: string | null;

  setToken: (token: string | null) => void;
  setUser: (user: unknown | null) => void;
  setOrganization: (org: unknown | null) => void;
  setCategories: (cats: CategoryPublic[]) => void;
  setSelectedCity: (city: string | null) => void;

  loadPersistedCity: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  token: null,
  user: null,
  organization: null,
  categories: [],
  selectedCity: null,

  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setOrganization: (org) => set({ organization: org }),
  setCategories: (categories) => set({ categories }),
  setSelectedCity: (city) => {
    set({ selectedCity: city });
    if (city) {
      AsyncStorage.setItem("selectedCity", city);
    } else {
      AsyncStorage.removeItem("selectedCity");
    }
  },

  loadPersistedCity: async () => {
    const city = await AsyncStorage.getItem("selectedCity");
    set({ selectedCity: city });
  },
}));
