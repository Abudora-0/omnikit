"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store of tool-id lists (favorites + recents),
 * shared reactively across components via useSyncExternalStore.
 */

const RECENT_KEY = "omnikit:recent";
const FAV_KEY = "omnikit:favorites";
const RECENT_MAX = 8;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  // Reflect changes made in other tabs.
  const onStorage = (e: StorageEvent) => {
    if (e.key === RECENT_KEY || e.key === FAV_KEY) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// Cache snapshots so useSyncExternalStore gets a stable reference until a write.
let recentCache: string[] = [];
let favCache: string[] = [];
let recentRaw = "__init__";
let favRaw = "__init__";

function recentSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(RECENT_KEY) ?? "";
  if (raw !== recentRaw) {
    recentRaw = raw;
    recentCache = read(RECENT_KEY);
  }
  return recentCache;
}

function favSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(FAV_KEY) ?? "";
  if (raw !== favRaw) {
    favRaw = raw;
    favCache = read(FAV_KEY);
  }
  return favCache;
}

const EMPTY: string[] = [];
const getServerSnapshot = () => EMPTY;

function write(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  emit();
}

export function useRecentTools() {
  const recent = useSyncExternalStore(subscribe, recentSnapshot, getServerSnapshot);

  const recordTool = useCallback((id: string) => {
    const current = read(RECENT_KEY);
    const next = [id, ...current.filter((x) => x !== id)].slice(0, RECENT_MAX);
    write(RECENT_KEY, next);
  }, []);

  const clearRecent = useCallback(() => write(RECENT_KEY, []), []);

  return { recent, recordTool, clearRecent };
}

/* ── Per-tool settings memory ─────────────────────────────────────────────
 * Remembers a tool's last-used option values (selects/numbers) so revisiting a
 * tool restores how you last set it up. Plain read/write — no reactive store
 * needed since the runner loads once on mount. */

const SETTINGS_PREFIX = "omnikit:settings:";

export function loadToolSettings(toolId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SETTINGS_PREFIX + toolId);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === "string"),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveToolSettings(toolId: string, values: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(values).length === 0) {
      window.localStorage.removeItem(SETTINGS_PREFIX + toolId);
    } else {
      window.localStorage.setItem(SETTINGS_PREFIX + toolId, JSON.stringify(values));
    }
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, favSnapshot, getServerSnapshot);

  const toggleFavorite = useCallback((id: string) => {
    const current = read(FAV_KEY);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
    write(FAV_KEY, next);
    return !current.includes(id); // true if now favorited
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
