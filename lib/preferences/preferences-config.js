import {
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  SIDEBAR_VARIANT_VALUES,
} from "./layout";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES } from "./theme";

export const PREFERENCE_REGISTRY = Object.freeze({
  theme_mode: {
    values: THEME_MODE_VALUES,
    defaultValue: "light",
    persistence: "client-cookie",
    attribute: "data-theme-mode",
  },
  theme_preset: {
    values: THEME_PRESET_VALUES,
    defaultValue: "besd",
    persistence: "client-cookie",
    attribute: "data-theme-preset",
  },
  content_layout: {
    values: CONTENT_LAYOUT_VALUES,
    defaultValue: "centered",
    persistence: "client-cookie",
    attribute: "data-content-layout",
  },
  navbar_style: {
    values: NAVBAR_STYLE_VALUES,
    defaultValue: "sticky",
    persistence: "client-cookie",
    attribute: "data-navbar-style",
  },
  sidebar_variant: {
    values: SIDEBAR_VARIANT_VALUES,
    defaultValue: "sidebar",
    persistence: "client-cookie",
    attribute: "data-sidebar-variant",
  },
  sidebar_collapsible: {
    values: SIDEBAR_COLLAPSIBLE_VALUES,
    defaultValue: "icon",
    persistence: "client-cookie",
    attribute: "data-sidebar-collapsible",
  },
});

export const PREFERENCE_KEYS = Object.freeze(Object.keys(PREFERENCE_REGISTRY));

export function getPreferencePersistence(key) {
  return PREFERENCE_REGISTRY[key]?.persistence ?? "client-cookie";
}

export const PREFERENCE_DEFAULTS = Object.freeze(
  Object.fromEntries(PREFERENCE_KEYS.map((key) => [key, PREFERENCE_REGISTRY[key].defaultValue])),
);

export function parsePreference(key, rawValue) {
  const definition = PREFERENCE_REGISTRY[key];
  if (!definition) return undefined;

  if (rawValue && definition.values.includes(rawValue)) {
    return rawValue;
  }

  return definition.defaultValue;
}

