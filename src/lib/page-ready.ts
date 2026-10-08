"use client";

// The page entrance cue (part 11). Whatever covers the screen when a page
// arrives (the launch intro on a full load, the route transition later)
// fires the cue as it starts to leave, and every entrance on the page plays
// from it. Pages never know which cover it was. With no cover (reduced
// motion), the cue fires straight away.

export type PageCue = {
  /** Seconds until the cover is fully off the screen */
  clearIn: number;
};

type Pending = { promise: Promise<PageCue>; resolve: (cue: PageCue) => void; done: boolean };

function pending(): Pending {
  let resolve!: (cue: PageCue) => void;
  const promise = new Promise<PageCue>((r) => (resolve = r));
  const entry: Pending = { promise, resolve: (cue) => ((entry.done = true), resolve(cue)), done: false };
  return entry;
}

let current: Pending | null = null;

/** Resolves when the current page's cover starts to leave. */
export function whenPageReady(): Promise<PageCue> {
  if (typeof window === "undefined") return Promise.resolve({ clearIn: 0 });
  current ??= pending();
  return current.promise;
}

/** Fired by the cover as it starts to leave. */
export function signalPageReady(cue: PageCue = { clearIn: 0 }) {
  current ??= pending();
  current.resolve(cue);
}

/** Fired by a route transition as it starts to cover the old page, so the next page waits for its own cue. */
export function resetPageReady() {
  if (!current || current.done) current = pending();
}

// Route changes (part 11b). A click on an internal link (or the browser's
// back and forward) starts one: the next page's entrances wait for a fresh
// cue, which the page transition fires as the new page sweeps in. A change
// that never finishes (same page, a hash link) clears itself.

let routeChange: number | null = null;

/** Called when navigation to another page starts. */
export function beginRouteChange() {
  if (typeof window === "undefined") return;
  resetPageReady();
  if (routeChange !== null) window.clearTimeout(routeChange);
  routeChange = window.setTimeout(() => endRouteChange(), 2500);
}

/** Called by the page transition as the new page arrives. */
export function endRouteChange(cue: PageCue = { clearIn: 0 }) {
  if (routeChange === null) return;
  window.clearTimeout(routeChange);
  routeChange = null;
  signalPageReady(cue);
}

export const inRouteChange = () => routeChange !== null;
