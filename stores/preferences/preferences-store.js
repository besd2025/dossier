import { createStore } from "zustand/vanilla";
import { applyPreference } from "@/lib/preferences/preference-runtime";
import {
  PREFERENCE_DEFAULTS,
  PREFERENCE_KEYS,
} from "@/lib/preferences/preferences-config";
import { persistPreference } from "@/lib/preferences/preferences-storage";

export const createPreferencesStore = (initialValues = {}) => {
  const values = {
    ...PREFERENCE_DEFAULTS,
    ...initialValues,
  };

  return createStore()((set) => ({
    values,
    resolvedThemeMode: values.theme_mode === "dark" ? "dark" : "light",
    isSynced: false,

    setPreference: (key, value) => {
      const resolvedThemeMode = applyPreference(key, value);

      set((state) => ({
        values: {
          ...state.values,
          [key]: value,
        },
        ...(resolvedThemeMode ? { resolvedThemeMode } : {}),
      }));

      void persistPreference(key, value);
    },

    resetPreferences: () => {
      let resolvedThemeMode = "light";

      for (const key of PREFERENCE_KEYS) {
        const value = PREFERENCE_DEFAULTS[key];
        const resolved = applyPreference(key, value);

        if (resolved) resolvedThemeMode = resolved;
        void persistPreference(key, value);
      }

      set({
        values: { ...PREFERENCE_DEFAULTS },
        resolvedThemeMode,
      });
    },
  }));
};

