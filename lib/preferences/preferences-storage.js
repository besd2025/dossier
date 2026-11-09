"use client";

import { setValueToCookie } from "@/server/server-actions";
import { setClientCookie } from "../cookie.client";
import { setLocalStorageValue } from "../local-storage.client";
import { getPreferencePersistence } from "./preferences-config";

async function persistByMode(mode, key, value) {
  switch (mode) {
    case "none":
      return;
    case "client-cookie":
      setClientCookie(key, value);
      return;
    case "server-cookie":
      await setValueToCookie(key, value);
      return;
    case "localStorage":
      setLocalStorageValue(key, value);
      return;
    default:
      setClientCookie(key, value);
      return;
  }
}

export function persistPreference(key, value) {
  return persistByMode(getPreferencePersistence(key), key, value);
}

