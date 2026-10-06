"use client";

// Things the launch intro waits for before its last stage light (part 11a).
// A page can hold the countdown while something it needs loads (Nova holds it
// for his model), and releases it when ready or failed. The intro never waits
// longer than its deadline, so a hold that is never released only costs time.

const holds = new Set<Promise<void>>();
let finished = false;

/** Holds the intro until the returned function is called. */
export function holdIntro(): () => void {
  if (finished) return () => {};
  let release!: () => void;
  holds.add(new Promise<void>((resolve) => (release = resolve)));
  return release;
}

/** Resolves once every hold so far is released. */
export function introHolds(): Promise<void> {
  return Promise.all(holds).then(() => {});
}

/** Called by the intro when it lifts off; later holds are ignored. */
export function finishIntro() {
  finished = true;
  holds.clear();
}
