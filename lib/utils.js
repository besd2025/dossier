export { cn } from "cn";

export function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Formate une date au format français jj/MM/aaaa
 * @param {Date | string | number} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date et heure au format français jj/MM/aaaa HH:mm (24h)
 * @param {Date | string | number} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} à ${hours}:${minutes}`;
}

/**
 * Formate une heure au format français HH:mm (24h)
 * @param {Date | string | number} date
 * @returns {string}
 */
export function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Détermine la valeur appropriée pour `nativeButton` avec Base UI.
 * Si l'élément passé à `render` ou via `asChild` n'est pas un <button> natif (ex: <a>, <Link>),
 * nativeButton doit être `false` pour éviter les avertissements de sémantique.
 *
 * @param {any} renderProp
 * @param {boolean} [nativeButton]
 * @returns {boolean | undefined}
 */
export function resolveNativeButton(renderProp, nativeButton) {
  if (nativeButton !== undefined) return nativeButton;
  if (!renderProp) return undefined;
  if (typeof renderProp === "function") return false;
  if (typeof renderProp === "object" && renderProp !== null && renderProp.type !== "button") {
    return false;
  }
  return undefined;
}
