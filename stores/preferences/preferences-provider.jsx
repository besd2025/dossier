"use client";

import { createContext, use, useEffect, useState } from "react";
import { useStore } from "zustand";

import {
  PREFERENCE_DEFAULTS,
  PREFERENCE_KEYS,
  PREFERENCE_REGISTRY,
  parsePreference,
} from "@/lib/preferences/preferences-config";
import { applyThemeMode, subscribeToSystemTheme } from "@/lib/preferences/theme-utils";
import { createPreferencesStore } from "./preferences-store";

const PreferencesStoreContext = createContext(null);

function readDomPreference(key) {
  const definition = PREFERENCE_REGISTRY[key];
  if (!definition) return undefined;
  const rawValue = document.documentElement.getAttribute(definition.attribute);
  return parsePreference(key, rawValue);
}

function readDomPreferences() {
  const values = { ...PREFERENCE_DEFAULTS };
  for (const key of PREFERENCE_KEYS) {
    values[key] = readDomPreference(key);
  }
  return values;
}

export function PreferencesStoreProvider({ children, initialValues = PREFERENCE_DEFAULTS }) {
  const [store] = useState(() => createPreferencesStore(initialValues));

  useEffect(() => {
    store.setState({
      values: readDomPreferences(),
      resolvedThemeMode: document.documentElement.classList.contains("dark") ? "dark" : "light",
      isSynced: true,
    });
  }, [store]);

  useEffect(() => {
    let unsubscribeMedia;

    const subscribeForMode = (mode) => {
      unsubscribeMedia?.();
      unsubscribeMedia = undefined;

      if (mode === "system") {
        unsubscribeMedia = subscribeToSystemTheme(() => {
          store.setState({ resolvedThemeMode: applyThemeMode("system") });
        });
      }
    };

    subscribeForMode(store.getState().values.theme_mode);

    const unsubscribeStore = store.subscribe((state, previousState) => {
      if (state.values.theme_mode !== previousState.values.theme_mode) {
        subscribeForMode(state.values.theme_mode);
      }
    });

    return () => {
      unsubscribeMedia?.();
      unsubscribeStore();
    };
  }, [store]);

  return (
    <PreferencesStoreContext.Provider value={store}>
      {children}
    </PreferencesStoreContext.Provider>
  );
}

export function usePreferencesStore(selector) {
  const store = use(PreferencesStoreContext);
  if (!store) {
    throw new Error("Missing PreferencesStoreProvider");
  }
  return useStore(store, selector);
}

