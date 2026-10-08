"use client";

import { useSyncExternalStore } from "react";

// The visitor's cookie choice (docs/specs/pages/legal.md). Opt-in: nothing
// beyond the essentials runs until the visitor says yes. The choice lives in
// localStorage under a versioned key; bump VERSION when the categories change
// and everyone is asked again. Every change fires `cookie:consent` on window.

const KEY = "skyline-cookie-consent";
const VERSION = 1;
const OPEN_EVENT = "cookie:open";

export type Consent = {
  /** Remembers small site settings */
  preferences: boolean;
  /** Google Analytics */
  analytics: boolean;
  /** Ad platforms (Meta Pixel); never on while doNotSell is */
  marketing: boolean;
  /** Opt out of selling or sharing data (US state privacy laws) */
  doNotSell: boolean;
  /** The browser sent Do Not Track or Global Privacy Control when this was saved */
  signal: boolean;
  /** When it was saved (ms) */
  at: number;
};

export type ConsentChoice = Pick<Consent, "preferences" | "analytics" | "marketing" | "doNotSell">;

/** Do Not Track or Global Privacy Control. */
export function privacySignal() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const dnt = String(nav.doNotTrack ?? (window as Window & { doNotTrack?: string }).doNotTrack ?? nav.msDoNotTrack ?? "");
  return dnt === "1" || dnt === "yes" || nav.globalPrivacyControl === true;
}

export const ESSENTIAL_ONLY: ConsentChoice = { preferences: false, analytics: false, marketing: false, doNotSell: true };
export const EVERYTHING: ConsentChoice = { preferences: true, analytics: true, marketing: true, doNotSell: false };

function read(): Consent | null {
  try {
    const stored = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    if (!stored || stored.version !== VERSION) return null;
    const doNotSell = Boolean(stored.doNotSell);
    return {
      preferences: Boolean(stored.preferences),
      analytics: Boolean(stored.analytics),
      marketing: Boolean(stored.marketing) && !doNotSell,
      doNotSell,
      signal: Boolean(stored.signal),
      at: Number(stored.at) || 0,
    };
  } catch {
    return null;
  }
}

// One cached snapshot so useSyncExternalStore sees a stable value.
let cache: Consent | null | undefined;
const listeners = new Set<() => void>();
const notify = () => {
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent("cookie:consent", { detail: cache }));
};

export function getConsent(): Consent | null {
  if (cache === undefined) cache = read();
  return cache;
}

export function saveConsent(choice: ConsentChoice) {
  const value: Consent = { ...choice, marketing: choice.marketing && !choice.doNotSell, signal: privacySignal(), at: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ...value }));
  } catch {
    // Private mode or storage blocked: the choice still holds for this visit.
  }
  cache = value;
  notify();
}

/** Forget the choice (the banner comes back). */
export function resetConsent() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
  cache = null;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The saved choice: `null` before the visitor has chosen, `undefined` while
 * rendering on the server (so nothing consent-related renders until the
 * browser knows).
 */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribe, getConsent, () => undefined);
}

/** Opens the preferences dialog from anywhere (footer, privacy page). */
export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenCookiePreferences(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
