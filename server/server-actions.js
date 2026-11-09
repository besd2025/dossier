"use server";

import { cookies } from "next/headers";
import {
  getPreferencePersistence,
  PREFERENCE_REGISTRY,
  parsePreference,
} from "@/lib/preferences/preferences-config";

export async function getValueFromCookie(key) {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value;
}

export async function setValueToCookie(key, value, options = {}) {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    path: options.path ?? "/",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // 7 jours
  });
}

export async function getPreference(key) {
  const definition = PREFERENCE_REGISTRY[key];
  if (!definition) return undefined;

  const persistence = getPreferencePersistence(key);
  if (persistence !== "client-cookie" && persistence !== "server-cookie") {
    return definition.defaultValue;
  }

  const cookieStore = await cookies();
  const rawValue = cookieStore.get(key)?.value?.trim();
  return parsePreference(key, rawValue);
}

