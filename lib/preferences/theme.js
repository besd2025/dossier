export const THEME_MODE_OPTIONS = Object.freeze([
  { label: "Clair", value: "light" },
  { label: "Sombre", value: "dark" },
  { label: "Système", value: "system" },
]);

export const THEME_MODE_VALUES = Object.freeze(THEME_MODE_OPTIONS.map((o) => o.value));

export const THEME_PRESET_OPTIONS = Object.freeze([
  {
    label: "BESD (Institutionnel)",
    value: "besd",
    primary: {
      light: "oklch(0.28 0.08 250)",
      dark: "oklch(0.75 0.12 250)",
    },
  },
  {
    label: "Défaut",
    value: "default",
    primary: {
      light: "oklch(0.205 0 0)",
      dark: "oklch(0.922 0 0)",
    },
  },
]);

export const THEME_PRESET_VALUES = Object.freeze(THEME_PRESET_OPTIONS.map((p) => p.value));

