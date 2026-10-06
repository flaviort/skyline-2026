import * as THREE from "three";
import { clamp } from "@/lib/utils";

// The space journey between the banner and the about section (part 01b,
// round 2). Everything here is a pure function of the journey progress `j`
// (0 when the banner starts to leave, 1 when space has cleared and the
// landing takes over), so Nova and the cast always agree on where things are.
// Places are screen fractions (x right, y down) at a world depth `z`;
// sizes are in Nova heights (`K`, his full height in world units at z = 0).

/** Nova's size while he circles the planet, as a scale multiplier (full size the rest of the journey) */
export const ORBIT_SIZE = 0.72;
/** Camera settings shared with the canvas */
export const CAMERA_Z = 10;
export const CAMERA_FOV = 30;

export const range = (value: number, from: number, to: number) => clamp((value - from) / (to - from), 0, 1);
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** 0 at both ends, 1 in the middle */
export const bump = (t: number) => Math.sin(Math.PI * clamp(t, 0, 1));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Half the visible height in world units at depth z */
const halfHeight = (z: number) => (CAMERA_Z - z) * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

/** Screen fractions at depth z to a world position. */
export function toWorld(fx: number, fy: number, z: number, aspect: number, out: THREE.Vector3) {
  const hh = halfHeight(z);
  return out.set((fx - 0.5) * 2 * hh * aspect, -(fy - 0.5) * 2 * hh, z);
}

/** A world position to screen fractions (its own depth kept in z). */
export function toScreen(world: THREE.Vector3, aspect: number, out: THREE.Vector3) {
  const hh = halfHeight(world.z);
  return out.set(world.x / (2 * hh * aspect) + 0.5, -world.y / (2 * hh) + 0.5, world.z);
}

type Key = [j: number, value: number];

/** Smooth path through keys (eased between neighbours, flat at the ends). */
function track(keys: Key[], j: number) {
  if (j <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [j1, v1] = keys[i];
    if (j <= j1) {
      const [j0, v0] = keys[i - 1];
      // Catmull-Rom through the neighbours, so motion never stops at a key.
      const vPrev = keys[i - 2]?.[1] ?? v0;
      const vNext = keys[i + 1]?.[1] ?? v1;
      const t = (j - j0) / (j1 - j0);
      const t2 = t * t;
      const t3 = t2 * t;
      return 0.5 * (2 * v0 + (-vPrev + v1) * t + (2 * vPrev - 5 * v0 + 4 * v1 - vNext) * t2 + (-vPrev + 3 * v0 - 3 * v1 + vNext) * t3);
    }
  }
  return keys[keys.length - 1][1];
}

// ---------------------------------------------------------------------------
// The cast

/** Rocket: blasts up past Nova's left early on. */
export function rocketAt(j: number) {
  // It keeps going until its smoke trail is off the top too.
  const t = range(j, 0, 0.44);
  return { fx: 0.3 + t * 0.12, fy: 1.45 - t * 3.3, z: -0.6, size: 1.1, lean: -0.12 };
}

export type AsteroidSpec = { fx: number; z: number; size: number; from: number; seed: number; lite?: boolean };

/** The drifting field; `lite` rocks are left out on small screens. */
export const ASTEROIDS: AsteroidSpec[] = [
  { fx: 0.14, z: -2.5, size: 0.32, from: 0.14, seed: 1 },
  { fx: 0.86, z: -1.2, size: 0.22, from: 0.18, seed: 2 },
  { fx: 0.3, z: 0.8, size: 0.14, from: 0.24, seed: 3, lite: true },
  { fx: 0.9, z: -3.5, size: 0.4, from: 0.27, seed: 4, lite: true },
  { fx: 0.08, z: -0.4, size: 0.18, from: 0.33, seed: 5 },
  { fx: 0.5, z: -4.5, size: 0.3, from: 0.36, seed: 6, lite: true },
];
const ASTEROID_SPAN = 0.32;

export function asteroidAt(spec: AsteroidSpec, j: number, time: number) {
  const t = range(j, spec.from, spec.from + ASTEROID_SPAN);
  return {
    fx: spec.fx + Math.sin(time * 0.2 + spec.seed) * 0.015,
    fy: 1.35 - t * 1.75 + Math.sin(time * 0.27 + spec.seed * 2) * 0.01,
    z: spec.z,
  };
}

/** The rock Nova kicks off: rises to his feet, then spins away down and right. */
export const KICK_AT = 0.38;
export function kickRockAt(j: number, novaFeet: number) {
  if (j <= KICK_AT) {
    const t = smooth(range(j, 0.2, KICK_AT));
    return { fx: 0.66 - t * 0.03, fy: 1.3 + (novaFeet - 1.3) * t, z: 0.2, spin: j * 3 };
  }
  const t = range(j, KICK_AT, 0.56);
  const out = t * (2 - t);
  return { fx: 0.63 + out * 0.32, fy: novaFeet + out * 0.9, z: 0.2 - out * 1.5, spin: KICK_AT * 3 + out * 9 };
}

/** Planet: rises, lingers in the middle while Nova circles it, moves on. */
export function planetAt(j: number) {
  return {
    fx: track([[0.36, 0.5], [0.5, 0.48], [0.66, 0.52], [0.82, 0.54]], j),
    fy: track([[0.36, 1.7], [0.5, 0.56], [0.66, 0.44], [0.82, -0.7]], j),
    z: -1.8,
    size: 0.62,
  };
}

/** Nova's orbit around the planet: how much of it applies, and the angle. */
export function orbitAt(j: number) {
  const blend = easeInOut(range(j, 0.44, 0.5)) * (1 - easeInOut(range(j, 0.64, 0.7)));
  // From the left and slightly in front, behind the planet, out on the right.
  const angle = Math.PI * (0.85 + easeInOut(range(j, 0.46, 0.68)) * 1.3);
  // Wide enough to clear the ring system.
  return { blend, angle, radius: 1.45 };
}

/** UFO: slides in from the right, hovers over Nova, zips off the top. */
export function ufoAt(j: number) {
  return {
    // Swoops in low from the right and pulls up over Nova.
    fx: track([[0.56, 1.35], [0.64, 0.95], [0.71, 0.63], [0.84, 0.6], [0.97, 0.68]], j),
    fy: track([[0.56, 0.1], [0.64, 0.34], [0.71, 0.25], [0.84, 0.23], [0.97, -0.65]], j),
    z: -0.8,
    size: 1.05,
    beam: easeInOut(range(j, 0.71, 0.75)) * (1 - easeInOut(range(j, 0.81, 0.85))),
    wave: bump(range(j, 0.74, 0.84)),
    // A crouch before it zips off, then a stretch on the way out.
    squash: bump(range(j, 0.82, 0.87)),
    stretch: bump(range(j, 0.87, 0.97)),
  };
}

export type SparkleSpec = { fx: number; fy: number; z: number; size: number; seed: number; lite?: boolean };

/**
 * A few sparkle stars, placed by hand below the screen so they drift up
 * through the journey: a mix of big and small, at different depths.
 */
export const SPARKLES: SparkleSpec[] = [
  { fx: 0.12, fy: 1.25, z: -1, size: 0.15, seed: 1 },
  { fx: 0.86, fy: 1.6, z: 0.4, size: 0.06, seed: 2, lite: true },
  { fx: 0.9, fy: 2.15, z: -0.6, size: 0.19, seed: 3 },
  { fx: 0.2, fy: 2.55, z: 0.6, size: 0.05, seed: 4 },
  { fx: 0.74, fy: 2.95, z: -2.2, size: 0.11, seed: 5, lite: true },
  { fx: 0.32, fy: 3.35, z: -1.4, size: 0.08, seed: 6 },
];

/**
 * Stars that pop in around the about text as Nova lands: x as a share of the
 * screen width from the centre, y in Nova heights from the landing spot, and
 * when (landing progress) each one appears.
 */
export const LANDING_SPARKLES = [
  { dx: -0.36, dy: 0.25, size: 0.15, at: 0.25, seed: 40 },
  { dx: 0.38, dy: 1.0, size: 0.07, at: 0.4, seed: 41 },
  { dx: 0.24, dy: -0.4, size: 0.06, at: 0.55, seed: 42 },
];

/** A pop with a little overshoot, 0 to 1 */
export const pop = (t: number) => {
  const c = 2.2;
  const x = clamp(t, 0, 1) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};

/** `flow` keeps growing past 1 through the landing, so stars drift off the top instead of stopping. */
export function sparkleAt(spec: SparkleSpec, flow: number, time: number) {
  // Nearer stars pass faster: parallax.
  const speed = 3 * (CAMERA_Z / (CAMERA_Z - spec.z));
  return { fx: spec.fx + Math.sin(time * 0.3 + spec.seed) * 0.01, fy: spec.fy - flow * speed, z: spec.z };
}

// ---------------------------------------------------------------------------
// Nova

export type NovaCue = {
  fx: number;
  fy: number;
  z: number;
  /** His size, as a multiplier (smaller while circling the planet) */
  scale: number;
  /** Extra whole-body turns (1 = 360deg) */
  spin: number;
  /** Knees pulled in, 0 to 1 */
  tuck: number;
  /** Legs pushing off */
  kick: number;
  /** Waving back at the alien, 0 to 1 */
  wave: number;
  /** Where he looks, in screen fractions, or null to look where he goes */
  lookX: number | null;
  lookY: number | null;
};

const NOVA_X: Key[] = [[0, 0.7], [0.1, 0.68], [0.2, 0.64], [0.3, 0.63], [KICK_AT, 0.63], [0.46, 0.36], [0.68, 0.4], [0.75, 0.6], [0.82, 0.6], [0.9, 0.55], [1, 0.5]];
const NOVA_Y: Key[] = [[0, 0.5], [0.1, 0.46], [0.2, 0.42], [0.3, 0.46], [KICK_AT, 0.5], [0.46, 0.36], [0.68, 0.56], [0.75, 0.64], [0.82, 0.52], [0.9, 0.48], [1, 0.45]];

const planetWorld = new THREE.Vector3();
const orbitWorld = new THREE.Vector3();
const orbitScreen = new THREE.Vector3();

/** Where Nova is and what he does at journey progress j. `K` is his banner height in world units. */
export function novaAt(j: number, aspect: number, K: number, out: NovaCue) {
  out.fx = track(NOVA_X, j);
  out.fy = track(NOVA_Y, j);
  out.z = 0;
  out.lookX = null;
  out.lookY = null;

  // Around the planet: a circle in depth, so he passes behind it.
  const orbit = orbitAt(j);
  if (orbit.blend > 0) {
    const planet = planetAt(j);
    toWorld(planet.fx, planet.fy, planet.z, aspect, planetWorld);
    const r = orbit.radius * K;
    // Tilted against the ring: over the top behind the planet, lower in front.
    orbitWorld.set(planetWorld.x + Math.cos(orbit.angle) * r, planetWorld.y - Math.sin(orbit.angle) * r * 0.5, planetWorld.z + Math.sin(orbit.angle) * r * 0.85);
    toScreen(orbitWorld, aspect, orbitScreen);
    out.fx += (orbitScreen.x - out.fx) * orbit.blend;
    out.fy += (orbitScreen.y - out.fy) * orbit.blend;
    out.z = orbitScreen.z * orbit.blend;
    out.lookX = planet.fx;
    out.lookY = planet.fy;
  }
  out.scale = 1 + (ORBIT_SIZE - 1) * orbit.blend;

  // The rocket's wake twirls him once.
  out.spin = easeInOut(range(j, 0.1, 0.28));
  // Tuck as the rock arrives, then push off it.
  out.tuck = bump(range(j, 0.3, KICK_AT + 0.01)) * 0.9;
  out.kick = bump(range(j, KICK_AT - 0.01, KICK_AT + 0.07));
  if (j > 0.26 && j < KICK_AT + 0.04) {
    out.lookX = kickRockAt(j, out.fy).fx;
    out.lookY = 1;
  }

  // Under the UFO: look up, wave back.
  const ufo = ufoAt(j);
  if (ufo.beam > 0.05 || ufo.wave > 0) {
    out.lookX = ufo.fx;
    out.lookY = ufo.fy;
  }
  out.wave = bump(range(j, 0.76, 0.86));
  return out;
}
