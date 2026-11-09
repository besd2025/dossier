/**
 * Utilitaires de gestion des cookies côté client
 */
function writeClientCookie(serializedCookie) {
  document.cookie = serializedCookie;
}

export function setClientCookie(key, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  writeClientCookie(`${key}=${value}; expires=${expires}; path=/`);
}

export function getClientCookie(key) {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${key}=`))
    ?.split("=")[1];
}

export function deleteClientCookie(key) {
  writeClientCookie(`${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`);
}

