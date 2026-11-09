// Options de variante de sidebar
export const SIDEBAR_VARIANT_OPTIONS = Object.freeze([
  { label: "Sidebar", value: "sidebar" },
  { label: "Inset", value: "inset" },
  { label: "Floating", value: "floating" },
]);
export const SIDEBAR_VARIANT_VALUES = Object.freeze(SIDEBAR_VARIANT_OPTIONS.map((v) => v.value));

// Options de repliement de la sidebar
export const SIDEBAR_COLLAPSIBLE_OPTIONS = Object.freeze([
  { label: "Icône", value: "icon" },
  { label: "Hors écran", value: "offcanvas" },
]);
export const SIDEBAR_COLLAPSIBLE_VALUES = Object.freeze(SIDEBAR_COLLAPSIBLE_OPTIONS.map((v) => v.value));

// Disposition du contenu
export const CONTENT_LAYOUT_OPTIONS = Object.freeze([
  { label: "Centré", value: "centered" },
  { label: "Pleine largeur", value: "full-width" },
]);
export const CONTENT_LAYOUT_VALUES = Object.freeze(CONTENT_LAYOUT_OPTIONS.map((v) => v.value));

// Style de la barre de navigation
export const NAVBAR_STYLE_OPTIONS = Object.freeze([
  { label: "Fixe (Sticky)", value: "sticky" },
  { label: "Défilant (Scroll)", value: "scroll" },
]);
export const NAVBAR_STYLE_VALUES = Object.freeze(NAVBAR_STYLE_OPTIONS.map((v) => v.value));

