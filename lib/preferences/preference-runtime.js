"use client";

import { PREFERENCE_REGISTRY } from "./preferences-config";
import { applyThemeMode } from "./theme-utils";

export function applyPreference(key, value) {
  if (key === "theme_mode") {
    return applyThemeMode(value);
  }

  const def = PREFERENCE_REGISTRY[key];
  if (def && typeof document !== "undefined") {
    document.documentElement.setAttribute(def.attribute, value);
  }
  return undefined;
}

