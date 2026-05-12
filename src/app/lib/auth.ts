import type { AuthResponse, StoredAuth } from "./types";

const AUTH_STORAGE_KEY = "certafrica.auth";

export function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: AuthResponse): StoredAuth {
  const stored: StoredAuth = { ...auth, savedAt: new Date().toISOString() };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
  return stored;
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
