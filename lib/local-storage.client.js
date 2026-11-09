"use client";

/**
 * Utilitaires pour le stockage local (localStorage)
 */
export function setLocalStorageValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[localStorage] Échec d'écriture :", error);
    }
  }
}

export function getLocalStorageValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

