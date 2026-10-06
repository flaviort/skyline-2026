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
