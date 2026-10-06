"use client";

// Phone tilt for Nova (touch screens only). Like the shared pointer, it is
// read every frame and never triggers React renders.
//
// Values are relative to how the phone is being held: the resting angle
// drifts toward the current one over a few seconds, so whatever angle the
// visitor holds becomes neutral and only movement counts.
//
// iPhones need permission, which Safari only asks for inside a tap: the
// first tap on the page (not on a link or button) shows the prompt. If it is
// declined, or the device has no sensor, `active` stays false and nothing
// changes.

export type TiltState = {
  /** -1 (tilted left) to 1 (tilted right) */
  x: number;
  /** -1 (top edge away from the visitor) to 1 (top edge toward them) */
  y: number;
  /** True once real readings arrive */
  active: boolean;
  /** performance.now() of the last reading */
  lastAt: number;
};

export const tilt: TiltState = { x: 0, y: 0, active: false, lastAt: 0 };

/** Degrees of tilt for a full reading of 1 */
const RANGE = 22;
/** Seconds for the resting angle to catch up with the held angle */
const RECENTER = 4;
const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label";

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

let started = false;
let rest: { beta: number; gamma: number } | null = null;
let restAt = 0;

function onOrientation(event: DeviceOrientationEvent) {
  if (event.beta === null || event.gamma === null) return;
  // Screen-relative axes: in landscape the phone's axes swap.
  const angle = (screen.orientation?.angle ?? 0) % 360;
  let side = event.gamma;
  let forward = event.beta;
  if (angle === 90) [side, forward] = [event.beta, -event.gamma];
  else if (angle === 270 || angle === -90) [side, forward] = [-event.beta, event.gamma];
  else if (angle === 180) [side, forward] = [-event.gamma, -event.beta];

  const now = performance.now();
  if (!rest) {
    rest = { beta: forward, gamma: side };
    restAt = now;
  }
  // Let the resting angle follow slowly.
  const follow = Math.min(1, (now - restAt) / 1000 / RECENTER);
  restAt = now;
  rest.beta += (forward - rest.beta) * follow;
  rest.gamma += (side - rest.gamma) * follow;

  tilt.x = clamp((side - rest.gamma) / RANGE);
  tilt.y = clamp((forward - rest.beta) / RANGE);
  tilt.active = true;
  tilt.lastAt = now;
}

function listen() {
  window.addEventListener("deviceorientation", onOrientation, { passive: true });
}

type OrientationWithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/** Starts listening on touch screens; on iPhones, asks on the first tap. Safe to call more than once. */
export function trackTilt() {
  if (started || typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  started = true;

  // Listen right away: where no permission is needed (Android), readings
  // simply start. Where the browser has a permission call (iPhones, and
  // recent Chrome, which grants it silently), also ask on the first tap.
  listen();
  const Orientation = window.DeviceOrientationEvent as OrientationWithPermission;
  if (typeof Orientation.requestPermission !== "function") return;
  const ask = (event: Event) => {
    if ((event.target as Element | null)?.closest?.(INTERACTIVE)) return;
    window.removeEventListener("click", ask);
    Orientation.requestPermission!().catch(() => {});
  };
  window.addEventListener("click", ask);
}

/** True while tilt readings keep coming in. */
export const tiltIsActive = () => tilt.active && performance.now() - tilt.lastAt < 1000;
