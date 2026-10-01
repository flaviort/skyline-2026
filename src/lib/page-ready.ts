"use client";

// Signals when a page is ready for its entrance motion. Part 11 (page
// transitions) will resolve this when the transition reveal starts; until
// then it resolves once fonts are loaded.

let readyPromise: Promise<void> | null = null;

export function whenPageReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!readyPromise) {
    readyPromise = (document.fonts?.ready ?? Promise.resolve()).then(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
  return readyPromise;
}
