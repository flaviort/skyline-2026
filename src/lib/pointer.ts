"use client";

// One shared pointer tracker for every pointer effect on the site
// (weight hover, Nova, trails). Components read it each frame; it never
// triggers React renders.

export type PointerState = {
  /** Viewport coordinates of the last pointer event */
  x: number;
  y: number;
  /** Page coordinates of the last pointer event */
  pageX: number;
  pageY: number;
  /** performance.now() of the last movement, 0 before any */
  lastMove: number;
  /** False once the pointer leaves the window */
  inside: boolean;
  /** The link or button under the pointer, if any */
  interactive: Element | null;
};

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label";

export const pointer: PointerState = {
  x: 0,
  y: 0,
  pageX: 0,
  pageY: 0,
  lastMove: 0,
  inside: false,
  interactive: null,
};

let listening = false;

function onMove(event: PointerEvent) {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.pageX = event.pageX;
  pointer.pageY = event.pageY;
  pointer.lastMove = performance.now();
  pointer.inside = true;
  const target = event.target instanceof Element ? event.target : null;
  pointer.interactive = target?.closest(INTERACTIVE) ?? null;
}

function onLeave(event: MouseEvent) {
  if (!event.relatedTarget) {
    pointer.inside = false;
    pointer.interactive = null;
  }
}

/** Starts the shared listeners once. Safe to call from any client effect. */
export function trackPointer() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("mouseout", onLeave, { passive: true });
}

/** True when the pointer moved within the last `ms` milliseconds and is in the window. */
export function pointerIsActive(ms = 2500) {
  return pointer.inside && pointer.lastMove > 0 && performance.now() - pointer.lastMove < ms;
}
