"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { createSuitScene } from "./nova-look";
import { clamp } from "@/lib/utils";
import {
  ASTEROIDS,
  CAMERA_FOV,
  CAMERA_Z,
  KICK_AT,
  LANDING_SPARKLES,
  SPARKLES,
  pop,
  asteroidAt,
  kickRockAt,
  planetAt,
  range,
  rocketAt,
  sparkleAt,
  toWorld,
  ufoAt,
} from "./space-journey";

// The space journey's cast (part 01b, round 2): a rocket, asteroids, a
// planet, a UFO with an alien and sparkle stars. Built from rounded shapes
// in Nova's own lacquer and lit by his studio, so they read as one render.
// Each piece is its own builder: a 3D designer's model can replace one
// without touching the timeline in space-journey.ts.

/** Shared with Nova: the journey progress he computes, and his place and size. */
export type JourneyState = {
  j: number;
  /** Nova's banner height in world units at z = 0 */
  K: number;
  /** Nova's centre and feet on screen, as fractions */
  novaFy: number;
  novaFeetFy: number;
  /** Nova's world position, for the UFO's beam */
  nova: THREE.Vector3;
  /** Small screens leave out some rocks and stars */
  lite: boolean;
  /** Phone tilt, smoothed, -1 to 1: parallax for the scene */
  tiltX: number;
  tiltY: number;
  /** Landing progress, and the landing spot on screen as fractions (it rides with the about section) */
  p: number;
  spotFx: number;
  spotFy: number;
};

export const createJourneyState = (): JourneyState => ({ j: 0, K: 1, novaFy: 0.5, novaFeetFy: 0.7, nova: new THREE.Vector3(), lite: false, tiltX: 0, tiltY: 0, p: 0, spotFx: 0.5, spotFy: 2 });

const COLORS = {
  white: "#f2f4f8",
  orange: "#ff4f00",
  cobalt: "#2340ff",
  lilac: "#c8b6ff",
  visor: "#ffb800",
  ink: "#16171c",
  rock: "#a39280",
  /** The alien (--color-alien) */
  alien: "#7bd94a",
};

function lacquer(color: string, environment: THREE.Texture, roughness = 0.38) {
  return new THREE.MeshPhysicalMaterial({ color, roughness, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMap: environment });
}

function glowing(color: string, strength = 2) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), toneMapped: false });
}

/** A lathe from [radius, height] points, smooth and closed. */
function lathe(points: Array<[number, number]>, segments = 48) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

/** Smoothly sampled lathe profile through control points (rounded, no kinks). */
function softLathe(points: Array<[number, number]>, segments = 48) {
  const curve = new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y)));
  return new THREE.LatheGeometry(curve.getPoints(40), segments);
}

type Materials = ReturnType<typeof createMaterials>;

function createMaterials(environment: THREE.Texture) {
  return {
    white: lacquer(COLORS.white, environment),
    orange: lacquer(COLORS.orange, environment),
    cobalt: lacquer(COLORS.cobalt, environment, 0.3),
    lilac: lacquer(COLORS.lilac, environment),
    visor: lacquer(COLORS.visor, environment),
    ink: lacquer(COLORS.ink, environment, 0.3),
    // Matte clay, not lacquer: a rock should not shine like the suit.
    moon: lacquer("#f1e2c4", environment, 0.5),
    // Stone: flat-shaded facets, coloured per face, no shine.
    rock: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0, envMap: environment, envMapIntensity: 0.35 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#bcd4ff",
      roughness: 0.05,
      metalness: 0,
      clearcoat: 1,
      transparent: true,
      opacity: 0.2,
      envMap: environment,
      depthWrite: false,
    }),
    porthole: new THREE.MeshPhysicalMaterial({ color: "#2b3cff", roughness: 0.05, metalness: 0.6, clearcoat: 1, envMap: environment }),
    lampOn: glowing(COLORS.visor, 2.2),
    beacon: glowing("#ff2a2a", 3),
    engine: glowing("#7fe7ff", 2),
    alien: lacquer(COLORS.alien, environment, 0.32),
    eye: lacquer("#ffffff", environment, 0.15),
    chrome: new THREE.MeshPhysicalMaterial({ color: "#dfe3ea", roughness: 0.18, metalness: 1, envMap: environment }),
    // Stars glow from inside, so they shine on the dark.
    starGold: new THREE.MeshPhysicalMaterial({ color: COLORS.visor, emissive: COLORS.visor, emissiveIntensity: 0.9, roughness: 0.3, clearcoat: 1, envMap: environment }),
    starWhite: new THREE.MeshPhysicalMaterial({ color: "#ffffff", emissive: "#fff3d6", emissiveIntensity: 0.8, roughness: 0.3, clearcoat: 1, envMap: environment }),
    flame: glowing("#ff7a1a", 1.8),
    flameCore: glowing("#ffd27a", 2.4),
  };
}

// ---------------------------------------------------------------------------
// Rocket: a slim body with a pointed orange nose, swept sharp fins and a porthole.

/** A swept, pointed fin: flat with a thin bevel, so its edges stay crisp. */
function finGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.1);
  shape.lineTo(0.17, -0.12);
  shape.lineTo(0.19, -0.3);
  shape.lineTo(0, -0.16);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
  geometry.translate(0, 0, -0.01);
  return geometry;
}

function buildRocket(m: Materials) {
  const rocket = new THREE.Group();
  // Height about 1.1, base at -0.5.
  rocket.add(new THREE.Mesh(softLathe([[0, -0.5], [0.13, -0.5], [0.17, -0.38], [0.185, -0.12], [0.18, 0.14], [0.165, 0.26]]), m.white));
  rocket.add(new THREE.Mesh(lathe([[0.165, 0.255], [0.155, 0.33], [0.125, 0.43], [0.08, 0.52], [0.035, 0.58], [0, 0.61]]), m.orange));
  // Thin orange band and a white collar under the nose.
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.014, 12, 48), m.orange);
  band.rotation.x = Math.PI / 2;
  band.position.y = -0.24;
  rocket.add(band);
  // Porthole: white rim around a cobalt glass dome.
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.016, 12, 40), m.white);
  rim.position.set(0, 0.06, 0.18);
  rocket.add(rim);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.058, 24, 16), m.porthole);
  glass.scale.z = 0.4;
  glass.position.set(0, 0.06, 0.182);
  rocket.add(glass);
  // Three swept fins.
  const fin = finGeometry();
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const mesh = new THREE.Mesh(fin, m.orange);
    mesh.position.set(0.16, -0.26, 0);
    pivot.add(mesh);
    rocket.add(pivot);
  }
  // Nozzle.
  rocket.add(new THREE.Mesh(lathe([[0.08, -0.48], [0.11, -0.57], [0.1, -0.57]], 32), m.ink));
  // Exhaust: puffy balls streaming down, hot near the nozzle, white smoke further out.
  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const material = i % 3 === 0 ? m.flameCore : i % 3 === 1 ? m.flame : m.white;
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 3), material);
    rocket.add(puff);
    puffs.push(puff);
  }
  return {
    object: rocket,
    update(time: number) {
      puffs.forEach((puff, i) => {
        // Each puff loops down the trail, growing then shrinking away.
        const t = (time * 1.6 + i / puffs.length) % 1;
        const side = Math.sin(i * 2.7 + time * 3) * 0.08 * t;
        puff.position.set(side, -0.58 - t * 0.85, Math.cos(i * 1.9) * 0.05 * t);
        const hot = puff.material !== m.white;
        puff.scale.setScalar((hot ? 1.1 - t * 0.5 : 0.7 + t * 1.3) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, 0.25 + t * 0.85))));
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Asteroids: chiselled rocks. Big flat cuts break the round silhouette, a
// fine jitter roughens the surface, sharp-rimmed craters are pressed in and
// shaded darker, and the faces render flat so every facet catches the light.

function rockGeometry(seed: number) {
  const base = mergeVertices(new THREE.IcosahedronGeometry(1, 4).deleteAttribute("normal").deleteAttribute("uv"));
  const position = base.getAttribute("position") as THREE.BufferAttribute;
  const random = seeded(seed * 7919);
  const direction = () => new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
  // Cuts: anything beyond a plane is pushed most of the way back onto it.
  const cuts = Array.from({ length: 9 }, () => ({ normal: direction(), offset: 0.62 + random() * 0.25 }));
  const craters = Array.from({ length: 7 }, (_, i) => ({ center: direction(), size: i < 2 ? 0.38 + random() * 0.12 : 0.14 + random() * 0.16 }));
  const stretch = new THREE.Vector3(1.1 + random() * 0.35, 0.78 + random() * 0.15, 0.85 + random() * 0.2);
  const shade = new Float32Array(position.count);
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).normalize();
    let radius = 1 + (random() - 0.5) * 0.07;
    let dark = 0;
    for (const crater of craters) {
      const d = v.distanceTo(crater.center) / crater.size;
      if (d < 1) {
        radius -= (0.08 + crater.size * 0.38) * (1 - d * d);
        dark = Math.max(dark, Math.min(1, (1 - d) * 1.6));
      } else if (d < 1.25) {
        radius += 0.09 * crater.size * Math.sin(((d - 1) / 0.25) * Math.PI);
      }
    }
    v.multiplyScalar(radius);
    for (const cut of cuts) {
      const depth = v.dot(cut.normal) - cut.offset;
      if (depth > 0) v.addScaledVector(cut.normal, -depth * 0.85);
    }
    v.multiply(stretch);
    position.setXYZ(i, v.x, v.y, v.z);
    shade[i] = dark;
  }
  base.setAttribute("shade", new THREE.BufferAttribute(shade, 1));
  // Flat faces: split the shared vertices so each face shades on its own.
  const geometry = base.toNonIndexed();
  base.dispose();
  const flatShade = geometry.getAttribute("shade") as THREE.BufferAttribute;
  const colors = new Float32Array(flatShade.count * 3);
  const light = new THREE.Color("#9a8f84");
  const deep = new THREE.Color("#2f2a27");
  const color = new THREE.Color();
  for (let face = 0; face < flatShade.count; face += 3) {
    // One tone per face, a little varied, darker inside craters.
    const dark = (flatShade.getX(face) + flatShade.getX(face + 1) + flatShade.getX(face + 2)) / 3;
    const vary = (random() - 0.5) * 0.12;
    color.copy(light).lerp(deep, clamp(dark * 0.85 + 0.12 + vary, 0, 1));
    for (let k = 0; k < 3; k++) color.toArray(colors, (face + k) * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.deleteAttribute("shade");
  geometry.computeVertexNormals();
  return geometry;
}

// ---------------------------------------------------------------------------
// Canvas textures (generated, nothing downloaded).

function canvasTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void, color = true) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Deterministic noise for the generated textures. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

/** Soft glow with a four-point flare: star and lamp halos. */
function flareTexture() {
  return canvasTexture(128, 128, (c) => {
    const glow = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.18, "rgba(255,255,255,0.5)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = glow;
    c.fillRect(0, 0, 128, 128);
    c.globalCompositeOperation = "lighter";
    for (const [w, h] of [[128, 3], [3, 128]]) {
      const streak = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      streak.addColorStop(0, "rgba(255,255,255,0.9)");
      streak.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = streak;
      c.fillRect(64 - w / 2, 64 - h / 2, w, h);
    }
  });
}

function halo(texture: THREE.Texture, color: string) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }),
  );
  sprite.renderOrder = 4;
  return sprite;
}

// ---------------------------------------------------------------------------
// Planet: banded violet surface with soft craters, a layered ring system, a soft
// atmosphere and two moons.

function planetTextures() {
  const random = seeded(7);
  // Colour: soft bands of violets and lilacs with wispy streaks.
  const map = canvasTexture(1024, 512, (c) => {
    const bands = ["#c8b6ff", "#b59df7", "#d7c9ff", "#a58be8", "#c3adff", "#9c7fe0", "#cdbcff", "#b8a2f5"];
    let y = 0;
    while (y < 512) {
      const height = 18 + random() * 60;
      c.fillStyle = bands[Math.floor(random() * bands.length)];
      c.fillRect(0, y, 1024, height + 2);
      y += height;
    }
    c.filter = "blur(10px)";
    c.drawImage(c.canvas, 0, 0);
    c.filter = "none";
    // Long wispy streaks along the bands.
    for (let i = 0; i < 40; i++) {
      c.strokeStyle = random() > 0.5 ? "rgba(255,255,255,0.12)" : "rgba(90,60,170,0.14)";
      c.lineWidth = 2 + random() * 6;
      const sy = random() * 512;
      c.beginPath();
      c.moveTo(random() * 1024, sy);
      c.bezierCurveTo(random() * 1024, sy + (random() - 0.5) * 30, random() * 1024, sy + (random() - 0.5) * 30, random() * 1024, sy);
      c.stroke();
    }
  });
  // Bump: craters scattered over the surface.
  const bump = canvasTexture(
    1024,
    512,
    (c) => {
      c.fillStyle = "#808080";
      c.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 70; i++) {
        const x = random() * 1024;
        const y = 60 + random() * 392;
        const r = 4 + random() ** 2 * 34;
        const bowl = c.createRadialGradient(x, y, 0, x, y, r);
        bowl.addColorStop(0, "#4a4a4a");
        bowl.addColorStop(0.75, "#6a6a6a");
        bowl.addColorStop(0.9, "#a8a8a8");
        bowl.addColorStop(1, "rgba(128,128,128,0)");
        c.fillStyle = bowl;
        c.beginPath();
        c.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2);
        c.fill();
      }
    },
    false,
  );
  // Rings: concentric bands with gaps, orange through cream.
  const rings = canvasTexture(512, 512, (c) => {
    const centre = 256;
    const inner = 256 * (1.25 / 1.8);
    for (let r = 256; r > inner; r -= 1) {
      const t = (r - inner) / (256 - inner);
      const gap = Math.abs(t - 0.62) < 0.035 || Math.abs(t - 0.25) < 0.02;
      const shade = 0.75 + Math.sin(t * 60) * 0.12 + Math.sin(t * 13) * 0.1;
      // Mixed in sRGB (getStyle), so the orange stays the brand orange.
      const color = new THREE.Color("#ff4f00").lerp(new THREE.Color("#ffc890"), t < 0.5 ? 0.12 : 0.5 * (1 - t)).multiplyScalar(shade);
      c.globalAlpha = gap ? 0.08 : 0.95 - t * 0.2;
      c.strokeStyle = color.getStyle();
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(centre, centre, r, 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
  });
  return { map, bump, rings };
}

function buildPlanet(m: Materials, moonGeometry: THREE.BufferGeometry) {
  const planet = new THREE.Group();
  const textures = planetTextures();
  const surface = new THREE.MeshPhysicalMaterial({
    map: textures.map,
    bumpMap: textures.bump,
    bumpScale: 1.5,
    // Satin, not glossy: no sharp reflections across the surface.
    roughness: 0.78,
    metalness: 0,
    envMap: (m.white as THREE.MeshPhysicalMaterial).envMap,
    envMapIntensity: 0.5,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), surface);
  planet.add(body);
  // Atmosphere: a soft violet glow round the rim.
  const glow = halo(
    canvasTexture(128, 128, (c) => {
      const g = c.createRadialGradient(64, 64, 40, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
    }),
    "#9d7cff",
  );
  glow.scale.setScalar(3.1);
  glow.material.opacity = 0.55;
  glow.renderOrder = -1;
  planet.add(glow);
  // Ring system: a flat banded disc, tilted.
  // Partly self-lit so the orange stays orange on the shadow side.
  const ringMaterial = new THREE.MeshStandardMaterial({
    map: textures.rings,
    emissive: "#ffffff",
    emissiveMap: textures.rings,
    emissiveIntensity: 0.55,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.6,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.8, 128, 1), ringMaterial);
  // RingGeometry's UVs are planar, so the concentric texture lines up with the disc.
  ring.rotation.set(-Math.PI / 2 + 0.38, 0.22, 0);
  planet.add(ring);
  // Two moons: a cratered yellow one and a tiny white one.
  const moon = new THREE.Mesh(moonGeometry, m.moon);
  moon.scale.setScalar(0.18);
  planet.add(moon);
  const moonlet = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 16), m.white);
  planet.add(moonlet);
  return {
    object: planet,
    update(time: number) {
      planet.rotation.z = Math.sin(time * 0.18) * 0.06;
      body.rotation.y = time * 0.12;
      ring.rotation.z = time * 0.03;
      const a = time * 0.45;
      moon.position.set(Math.cos(a) * 2.7, Math.sin(a) * 0.7, Math.sin(a) * 2.7);
      moon.rotation.y = time * 0.6;
      const b = -time * 0.8 + 2;
      moonlet.position.set(Math.cos(b) * 1.7, 0.9 + Math.sin(b) * 0.2, Math.sin(b) * 1.7);
    },
  };
}

// ---------------------------------------------------------------------------
// UFO: a cobalt saucer with chrome trim and rivets, chasing lights, a glowing
// engine ring underneath, an antenna, a glass dome and a green alien with big
// heavy-lidded eyes.

function buildUfo(m: Materials, flare: THREE.Texture) {
  const ufo = new THREE.Group();
  // Width 2 (radius 1).
  ufo.add(new THREE.Mesh(softLathe([[0, -0.3], [0.32, -0.27], [0.74, -0.1], [0.94, 0.0], [0.82, 0.12], [0.48, 0.2], [0, 0.21]], 64), m.cobalt));
  // Chrome trim round the rim, with rivets.
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.045, 16, 96), m.chrome);
  trim.rotation.x = Math.PI / 2;
  ufo.add(trim);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 12, 64), m.chrome);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.2;
  ufo.add(collar);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), m.chrome);
    rivet.position.set(Math.cos(a) * 0.7, 0.155, Math.sin(a) * 0.7);
    ufo.add(rivet);
  }
  // Lights on the trim, each with a glow that chases round.
  const lamps: Array<{ bulb: THREE.Mesh; glow: THREE.Sprite }> = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), m.visor);
    bulb.position.set(Math.cos(a) * 0.99, 0, Math.sin(a) * 0.99);
    const glow = halo(flare, "#ffc23a");
    glow.position.copy(bulb.position);
    ufo.add(bulb, glow);
    lamps.push({ bulb, glow });
  }
  // Engine glow underneath: a ring of light around a hatch.
  const engine = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 12, 64), m.engine);
  engine.rotation.x = Math.PI / 2;
  engine.position.y = -0.29;
  ufo.add(engine);
  const engineGlow = halo(flare, "#7fe7ff");
  engineGlow.position.y = -0.34;
  ufo.add(engineGlow);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 32), m.chrome);
  hatch.position.y = -0.3;
  ufo.add(hatch);

  // The alien: a green pear with two big eyes under heavy lids, antennae and a waving arm.
  const alien = new THREE.Group();
  alien.position.y = 0.16;
  alien.scale.setScalar(1.3);
  const body = new THREE.Mesh(softLathe([[0, 0], [0.14, 0.02], [0.18, 0.12], [0.16, 0.26], [0.12, 0.36], [0.05, 0.41], [0, 0.415]], 40), m.alien);
  alien.add(body);
  const lids: THREE.Mesh[] = [];
  const pupils: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.065, 0.27, 0.115);
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), m.eye);
    eye.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), m.ink);
    pupil.position.z = 0.045;
    eye.add(pupil);
    pupils.push(pupil);
    // Upper lid: a green shell over the top of the eye, half closed for a deadpan look.
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.064, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.alien);
    lid.rotation.x = 0.5;
    eye.add(lid);
    lids.push(lid);
    alien.add(eye);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.16, 8), m.alien);
    stalk.position.set(side * 0.06, 0.47, 0);
    stalk.rotation.z = -side * 0.3;
    alien.add(stalk);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), m.lampOn);
    tip.position.set(side * 0.085, 0.55, 0);
    alien.add(tip);
  });
  const shoulder = new THREE.Group();
  shoulder.position.set(0.15, 0.2, 0.02);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.12, 6, 12), m.alien);
  arm.position.y = 0.08;
  shoulder.add(arm);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), m.alien);
  hand.position.y = 0.17;
  shoulder.add(hand);
  alien.add(shoulder);
  ufo.add(alien);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), m.glass);
  dome.position.y = 0.2;
  dome.renderOrder = 2;
  ufo.add(dome);
  // Antenna on the dome with a blinking red tip, like Nova's.
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.16, 8), m.chrome);
  mast.position.y = 0.77;
  ufo.add(mast);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), m.beacon);
  beacon.position.y = 0.86;
  const beaconGlow = halo(flare, "#ff3a2a");
  beaconGlow.position.y = 0.86;
  ufo.add(beacon, beaconGlow);

  // The tractor beam: a soft cone of light, drawn in world space toward Nova.
  const fade = canvasTexture(4, 128, (c) => {
    const gradient = c.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.35)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gradient;
    c.fillRect(0, 0, 4, 128);
  });
  const beamMaterial = new THREE.MeshBasicMaterial({
    map: fade,
    color: new THREE.Color("#7fe7ff").multiplyScalar(1.3),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  // Unit height, tip at the origin, opening downward along -y.
  const beamGeometry = new THREE.ConeGeometry(1, 1, 48, 1, true);
  beamGeometry.translate(0, -0.5, 0);
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.renderOrder = 3;

  return {
    object: ufo,
    beam,
    setBeam: (opacity: number) => void (beamMaterial.opacity = opacity),
    update(time: number, wave: number, beamOn: number) {
      lamps.forEach(({ bulb, glow }, i) => {
        // A steady chase around the rim.
        const on = (Math.sin(time * 6 - i * 0.9) + 1) / 2;
        bulb.material = on > 0.55 ? m.lampOn : m.visor;
        glow.scale.setScalar(0.12 + on * 0.22);
        glow.material.opacity = 0.25 + on * 0.75;
      });
      const pulse = (Math.sin(time * 5) + 1) / 2;
      engineGlow.scale.setScalar(0.5 + pulse * 0.25 + beamOn * 0.6);
      engineGlow.material.opacity = 0.5 + beamOn * 0.5;
      const blink = time % 1.4 < 0.15 ? 1 : 0;
      beaconGlow.scale.setScalar(0.08 + blink * 0.18);
      // The saucer turns; the alien keeps facing the visitor, looking around a little.
      alien.rotation.y = -ufo.rotation.y + Math.sin(time * 0.7) * 0.25;
      shoulder.rotation.z = -0.4 - wave * (1.7 + Math.sin(time * 11) * 0.5);
      body.scale.set(1 + Math.sin(time * 2.3) * 0.02, 1 - Math.sin(time * 2.3) * 0.03, 1);
      // Pupils glance down toward Nova; a blink every few seconds.
      pupils.forEach((pupil) => pupil.position.set(0.012, -0.018, 0.045));
      const blinking = time % 3.7 < 0.14 ? 1 : 0;
      lids.forEach((lid) => (lid.rotation.x = 0.5 + blinking * 1.1 - wave * 0.25));
    },
  };
}

// ---------------------------------------------------------------------------
// Sparkle stars: chubby four-point stars, extruded with a fat bevel.

function sparkleGeometry() {
  const shape = new THREE.Shape();
  const points = 4;
  const outer = 1;
  const inner = 0.32;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2 + Math.PI / 2;
    const next = ((i + 1) / points) * Math.PI * 2 + Math.PI / 2;
    const mid = (a + next) / 2;
    const tip = new THREE.Vector2(Math.cos(a) * outer, Math.sin(a) * outer);
    if (i === 0) shape.moveTo(tip.x, tip.y);
    // Curved sides pulled toward the centre: a soft, puffy sparkle.
    shape.quadraticCurveTo(Math.cos(mid) * inner, Math.sin(mid) * inner, Math.cos(next) * outer, Math.sin(next) * outer);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.14, bevelSegments: 6, curveSegments: 12 });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

// ---------------------------------------------------------------------------

const place = new THREE.Vector3();
/** Visibility set through a helper: the cast is memoized, so the frame loop never assigns to it directly. */
const show = (object: THREE.Object3D, visible: boolean) => void (object.visible = visible);
const beamFrom = new THREE.Vector3();
const beamTo = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** The journey's cast, placed every frame from the shared journey state. */
export function SpaceCast({ journey }: { journey: RefObject<JourneyState> }) {
  const gl = useThree((state) => state.gl);
  const environment = useMemo(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const texture = generator.fromScene(createSuitScene(), 0.04).texture;
    generator.dispose();
    return texture;
  }, [gl]);

  const cast = useMemo(() => {
    const m = createMaterials(environment);
    const flare = flareTexture();
    const root = new THREE.Group();
    const rocket = buildRocket(m);
    const rocks = [1, 2, 3].map(rockGeometry);
    const planet = buildPlanet(m, new THREE.SphereGeometry(1, 32, 24));
    const ufo = buildUfo(m, flare);
    const asteroids = ASTEROIDS.map((spec, i) => {
      const mesh = new THREE.Mesh(rocks[i % rocks.length], m.rock);
      mesh.rotation.set(spec.seed, spec.seed * 2, 0);
      return { spec, mesh };
    });
    const kickRock = new THREE.Mesh(rocks[1], m.rock);
    const starShape = sparkleGeometry();
    // A star: the shape plus a glow with a four-point flare.
    const star = (i: number) => {
      const group = new THREE.Group();
      const gold = i % 3 !== 0;
      group.add(new THREE.Mesh(starShape, gold ? m.starGold : m.starWhite));
      const glow = halo(flare, gold ? "#ffcf5a" : "#fff6e0");
      glow.scale.setScalar(3.4);
      group.add(glow);
      return { group, glow };
    };
    const sparkles = SPARKLES.map((spec, i) => ({ spec, ...star(i) }));
    const landing = LANDING_SPARKLES.map((spec, i) => ({ spec, ...star(i + 1) }));
    [rocket.object, planet.object, ufo.object, ufo.beam, kickRock, ...asteroids.map((a) => a.mesh), ...sparkles.map((s) => s.group), ...landing.map((s) => s.group)].forEach(
      (object) => {
        object.visible = false;
        root.add(object);
      },
    );
    return { root, m, flare, rocket, planet, ufo, asteroids, kickRock, sparkles, landing };
  }, [environment]);

  useEffect(
    () => () => {
      environment.dispose();
      cast.flare.dispose();
      cast.root.traverse((node) => {
        const mesh = node as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.MeshStandardMaterial | undefined;
        if (material && !Array.isArray(material)) {
          material.map?.dispose();
          material.bumpMap?.dispose();
        }
      });
      Object.values(cast.m).forEach((material) => material.dispose());
    },
    [cast, environment],
  );

  // The UFO's own motion, integrated frame to frame so it never jumps.
  const saucer = useRef({ spin: 0, bank: 0, climb: 0 });

  useFrame((state, delta) => {
    const s = journey.current;
    if (!s) return;
    const { j, K, lite } = s;
    const dt = Math.min(delta, 1 / 30);
    const time = state.clock.elapsedTime;
    const aspect = state.size.width / state.size.height;
    // Everything is placed past the end too: by then it is all off screen,
    // and the stars keep drifting up through the landing.
    const on = j > 0.001;

    /** Places an object at screen fractions and depth, hidden when far off screen. */
    const put = (object: THREE.Object3D, fx: number, fy: number, z: number, scale: number, visible = on) => {
      object.visible = visible && fy > -0.9 && fy < 1.9;
      if (!object.visible) return false;
      // Tilt parallax: the scene slides against the tilt, nearer things more.
      const near = CAMERA_Z / (CAMERA_Z - z);
      toWorld(fx - s.tiltX * 0.06 * near, fy - s.tiltY * 0.04 * near, z, aspect, place);
      object.position.copy(place);
      object.scale.setScalar(scale);
      return true;
    };

    // Rocket.
    const rocket = rocketAt(j);
    if (put(cast.rocket.object, rocket.fx, rocket.fy, rocket.z, rocket.size * K)) {
      cast.rocket.object.rotation.set(Math.sin(time * 0.9) * 0.04, time * 0.8, rocket.lean + Math.sin(time * 1.3) * 0.03);
      cast.rocket.update(time);
    }

    // Asteroid field.
    cast.asteroids.forEach(({ spec, mesh }) => {
      const at = asteroidAt(spec, j, time);
      if (spec.lite && lite) {
        show(mesh, false);
        return;
      }
      if (put(mesh, at.fx, at.fy, at.z, spec.size * K)) {
        mesh.rotation.x += 0.004 + spec.seed * 0.0007;
        mesh.rotation.y += 0.003;
      }
    });

    // The rock he kicks off: its top meets his feet.
    const rockSize = 0.2 * K;
    const rock = kickRockAt(j, s.novaFeetFy + 0.03);
    if (put(cast.kickRock, rock.fx, rock.fy, rock.z, rockSize) && j > 0.15) {
      cast.kickRock.rotation.set(rock.spin * 0.6, rock.spin, 0.3);
    } else if (j <= 0.15) {
      show(cast.kickRock, false);
    }

    // Planet.
    const planet = planetAt(j);
    if (put(cast.planet.object, planet.fx, planet.fy, planet.z, planet.size * K)) {
      cast.planet.update(time);
    }

    // UFO: swoops in banking into the turn, spins faster while beaming,
    // crouches and then stretches as it zips off. Spin, bank and climb are
    // smoothed over time, so a fast scroll never makes it shake.
    const ufo = ufoAt(j);
    const ahead = ufoAt(Math.min(1, j + 0.01));
    const ufoVisible = put(cast.ufo.object, ufo.fx, ufo.fy, ufo.z, ufo.size * K * 0.5);
    const motion = saucer.current;
    motion.spin += dt * (0.8 + ufo.beam * 1.4);
    motion.bank = THREE.MathUtils.damp(motion.bank, clamp((ahead.fx - ufo.fx) * -25, -0.35, 0.35), 3, dt);
    motion.climb = THREE.MathUtils.damp(motion.climb, clamp((ahead.fy - ufo.fy) * 15, -0.25, 0.25), 3, dt);
    if (ufoVisible) {
      const squashX = 1 + ufo.squash * 0.18 - ufo.stretch * 0.3;
      const squashY = 1 - ufo.squash * 0.25 + ufo.stretch * 0.8;
      cast.ufo.object.scale.multiply(place.set(squashX, squashY, squashX));
      cast.ufo.object.rotation.set(0.2 + motion.climb + Math.sin(time * 1.2) * 0.04, motion.spin, motion.bank + Math.sin(time * 0.9) * 0.05);
      cast.ufo.object.position.setY(cast.ufo.object.position.y + Math.sin(time * 1.8) * 0.03 * K - ufo.squash * 0.04 * K);
      cast.ufo.update(time, ufo.wave, ufo.beam);
    }
    const beam = cast.ufo.beam;
    show(beam, ufoVisible && ufo.beam > 0.01);
    if (beam.visible) {
      // From under the saucer to just below Nova's feet.
      beamFrom.copy(cast.ufo.object.position).addScaledVector(UP, -0.14 * K);
      beamTo.copy(s.nova).addScaledVector(UP, -0.5 * K);
      const length = beamFrom.distanceTo(beamTo);
      beam.position.copy(beamFrom);
      beam.quaternion.setFromUnitVectors(UP, place.subVectors(beamFrom, beamTo).normalize());
      beam.scale.set(0.5 * K, length, 0.5 * K);
      cast.ufo.setBeam(ufo.beam * (0.14 + Math.sin(time * 9) * 0.03));
    }

    /** Spins and twinkles a star; its glow pulses brighter than the shape. */
    const shine = (group: THREE.Object3D, glow: THREE.Sprite, seed: number) => {
      const twinkle = (Math.sin(time * 2.4 + seed * 1.7) + 1) / 2;
      const flash = Math.max(0, Math.sin(time * 0.9 + seed * 2.3)) ** 12;
      group.rotation.set(Math.sin(time * 0.5 + seed) * 0.4, Math.sin(time * 0.4 + seed) * 0.5, time * 0.3 + seed);
      glow.material.opacity = 0.45 + twinkle * 0.35 + flash * 0.4;
      glow.material.rotation = -group.rotation.z;
      glow.scale.setScalar(2.6 + twinkle * 1.2 + flash * 2.5);
    };

    // Sparkle stars streaming past.
    cast.sparkles.forEach(({ spec, group, glow }) => {
      if (spec.lite && lite) {
        show(group, false);
        return;
      }
      const at = sparkleAt(spec, j + s.p * 0.4, time);
      if (put(group, at.fx, at.fy, at.z, spec.size * K)) shine(group, glow, spec.seed);
    });

    // Stars that pop in around the about text as Nova comes in to land, and ride with it.
    const nearHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    cast.landing.forEach(({ spec, group, glow }) => {
      // On phones the text fills the width: only the stars above the heading, around Nova.
      if (lite && spec.dy > -0.2) {
        show(group, false);
        return;
      }
      const grow = pop(range(s.p, spec.at, spec.at + 0.18));
      const fy = s.spotFy + (spec.dy * K) / nearHeight;
      if (put(group, s.spotFx + spec.dx, fy, 0.3, spec.size * K * grow, grow > 0.01)) shine(group, glow, spec.seed);
    });

    // Keep the kick rock out of the way once it has spun off.
    if (j > KICK_AT && range(j, KICK_AT, 0.56) >= 1) show(cast.kickRock, false);
  });

  return <primitive object={cast.root} />;
}
