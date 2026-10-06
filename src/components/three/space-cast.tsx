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

function crystal(color: string, tint: string, environment: THREE.Texture) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.04,
    // Partly see-through: full transmission shows the black behind and reads dark.
    transmission: 0.55,
    thickness: 0.7,
    ior: 1.6,
    dispersion: 5,
    attenuationColor: tint,
    attenuationDistance: 0.9,
    iridescence: 1,
    iridescenceIOR: 1.35,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    specularIntensity: 1,
    emissive: tint,
    emissiveIntensity: 0.6,
    envMap: environment,
    envMapIntensity: 2.4,
    flatShading: true,
  });
}

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
    lilac: lacquer(COLORS.lilac, environment),
    visor: lacquer(COLORS.visor, environment),
    ink: lacquer(COLORS.ink, environment, 0.3),
    // Matte clay, not lacquer: a rock should not shine like the suit.
    rock: stoneMaterial(environment),
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
    alien: lacquer(COLORS.alien, environment, 0.4),
    alienDark: lacquer("#2f5a22", environment, 0.5),
    // Glossy black eyes: a deep colour with a sharp clear coat for the highlights.
    eyeBlack: new THREE.MeshPhysicalMaterial({ color: "#0a0b0f", roughness: 0.15, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMap: environment, envMapIntensity: 1.2 }),
    glint: glowing("#ffffff", 1.6),
    // Satin silver hull.
    silver: new THREE.MeshPhysicalMaterial({ color: "#cfd4db", roughness: 0.32, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.15, envMap: environment }),
    bezel: lacquer("#3a3d44", environment, 0.35),
    amber: glowing("#ffae2e", 1.5),
    neon: glowing("#5fe8ff", 2),
    // Crystal stars (user reference, 2026-10-06): lilac glass that refracts
    // what is behind it, splits light into faint rainbows at the edges and
    // carries a soft iridescent sheen. A trace of inner light keeps them
    // readable against black space.
    crystal: crystal("#e4d9ff", "#a487ff", environment),
    crystalBlue: crystal("#dde4ff", "#8b9bff", environment),
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
// Asteroids, after the user's references (2026-10-06): lumpy pale stone
// covered in round craters of every size, with deep bowls, crisp raised
// rims, warmer and darker crater floors, fine grain and speckles. Shape,
// grain and colour are all baked into the vertices; nothing is downloaded.

/** Smooth 3D value noise, about -1..1. */
function noise3(x: number, y: number, z: number, seed: number) {
  const hash = (i: number, j: number, k: number) => {
    const h = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + seed * 19.19) * 43758.5453;
    return (h - Math.floor(h)) * 2 - 1;
  };
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fade = (t: number) => t * t * (3 - 2 * t);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return lerp(
    lerp(lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
    lerp(lerp(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), lerp(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v),
    w,
  );
}

/** Layered noise: broad lumps down to fine grain. */
function fbm(p: THREE.Vector3, seed: number, octaves: number, scale: number) {
  let total = 0;
  let amplitude = 1;
  let frequency = scale;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise3(p.x * frequency, p.y * frequency, p.z * frequency, seed + i * 7) * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return total / norm;
}

function rockGeometry(seed: number) {
  const geometry = mergeVertices(new THREE.IcosahedronGeometry(1, 6).deleteAttribute("normal").deleteAttribute("uv"));
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const random = seeded(seed * 7919);
  const direction = () => new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
  // Craters: a few big, more medium, many small.
  const craters = Array.from({ length: 30 }, (_, i) => {
    const size = i < 3 ? 0.3 + random() * 0.15 : i < 12 ? 0.14 + random() * 0.1 : 0.08 + random() * 0.05;
    return { center: direction(), size, depth: size * (0.5 + random() * 0.2) };
  });
  // Two or three broad flattened sides break the round outline.
  const cuts = Array.from({ length: 3 }, () => ({ normal: direction(), offset: 0.78 + random() * 0.12 }));
  const stretch = new THREE.Vector3(1.15 + random() * 0.3, 0.82 + random() * 0.12, 0.92 + random() * 0.15);

  const colors = new Float32Array(position.count * 3);
  const stone = new THREE.Color("#d2cabd");
  const shadow = new THREE.Color("#3e3732");
  const floor = new THREE.Color("#7d6650");
  const rimTone = new THREE.Color("#eee8de");
  const color = new THREE.Color();
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).normalize();
    // Lumps and grain.
    let radius = 1 + fbm(v, seed, 3, 1.6) * 0.16 + fbm(v, seed + 50, 3, 12) * 0.03;
    let bowl = 0;
    let rim = 0;
    for (const crater of craters) {
      const d = v.distanceTo(crater.center) / crater.size;
      if (d < 1) {
        // Steep walls and a flatter floor, like a real impact bowl.
        const inside = 1 - d ** 4;
        radius -= crater.depth * inside;
        bowl = Math.max(bowl, inside);
      }
      // A crisp raised rim just outside the edge.
      const edge = Math.exp(-(((d - 1) / 0.15) ** 2));
      radius += crater.depth * 0.45 * edge;
      rim = Math.max(rim, edge);
    }
    v.multiplyScalar(radius);
    for (const cut of cuts) {
      const depth = v.dot(cut.normal) - cut.offset;
      // Soft: flattens most of the way, keeps a little curve.
      if (depth > 0) v.addScaledVector(cut.normal, -depth * 0.7);
    }
    v.multiply(stretch);
    position.setXYZ(i, v.x, v.y, v.z);

    // Colour: pale stone with mottling and speckles, warm darker floors, light rims.
    const mottle = fbm(v, seed + 90, 3, 3);
    // Grain and speckles: small dark pits and pale flecks over the whole surface.
    const grain = noise3(v.x * 22, v.y * 22, v.z * 22, seed + 170) * 0.09;
    const pit = noise3(v.x * 30, v.y * 30, v.z * 30, seed + 130);
    const speckle = pit > 0.5 ? 0.3 : pit < -0.62 ? -0.25 : 0;
    color.copy(stone).lerp(shadow, clamp(Math.max(0, mottle * 0.35) + speckle + grain, -0.4, 1));
    color.lerp(floor, Math.min(1, bowl * 1.1)).lerp(shadow, bowl ** 1.5 * 0.55);
    color.lerp(rimTone, rim * (1 - bowl) * 0.5);
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** GLSL 3D value noise and layered noise, for the stone's per-pixel detail. */
const STONE_NOISE = /* glsl */ `
  float stoneHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float stoneNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(stoneHash(i), stoneHash(i + vec3(1, 0, 0)), f.x), mix(stoneHash(i + vec3(0, 1, 0)), stoneHash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(stoneHash(i + vec3(0, 0, 1)), stoneHash(i + vec3(1, 0, 1)), f.x), mix(stoneHash(i + vec3(0, 1, 1)), stoneHash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float stoneFbm(vec3 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      total += stoneNoise(p) * amplitude;
      p = p * 2.07 + 13.1;
      amplitude *= 0.5;
    }
    return total;
  }
  // Bends the normal by a height field's screen-space slope (as three's bump map does).
  vec3 stonePerturb(vec3 surfacePosition, vec3 surfaceNormal, vec2 dHdxy, float side) {
    vec3 vSigmaX = normalize(dFdx(surfacePosition));
    vec3 vSigmaY = normalize(dFdy(surfacePosition));
    vec3 vN = surfaceNormal;
    vec3 R1 = cross(vSigmaY, vN);
    vec3 R2 = cross(vN, vSigmaX);
    float fDet = dot(vSigmaX, R1) * side;
    vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
    return normalize(abs(fDet) * surfaceNormal - vGrad);
  }
`;

/**
 * Stone material. Per-pixel detail from 3D noise on the rock's own surface
 * (fine bumps that catch the light, grain, dark pits and pale flecks), so it
 * stays crisp however close a rock comes. The scene's blue and magenta rim
 * lights suit the suit, not rock: the lit colour is rebuilt from the stone's
 * own colour at the lit brightness, so it stays pale stone with warm floors.
 */
function stoneMaterial(environment: THREE.Texture) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, envMap: environment, envMapIntensity: 0.4 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vStonePosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvStonePosition = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vStonePosition;\n${STONE_NOISE}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 stoneP = vStonePosition;
        float stoneGrain = stoneFbm(stoneP * 16.0);
        float stonePits = stoneNoise(stoneP * 24.0 + 7.0);
        float stoneFlecks = stoneNoise(stoneP * 30.0 + 31.0);
        diffuseColor.rgb *= 0.9 + stoneGrain * 0.2;
        // Small pits read as tiny craters: soft, warm and dark.
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.62, 0.56, 0.5), smoothstep(0.8, 0.9, stonePits) * 0.8);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.89, 0.84), smoothstep(0.86, 0.95, stoneFlecks) * 0.3);`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        float stoneHeight = stoneFbm(vStonePosition * 9.0) + stoneFbm(vStonePosition * 20.0) * 0.3 - smoothstep(0.8, 0.9, stoneNoise(vStonePosition * 24.0 + 7.0)) * 0.3;
        vec2 stoneSlope = vec2(dFdx(stoneHeight), dFdy(stoneHeight)) * 1.6;
        normal = stonePerturb(-vViewPosition, normal, stoneSlope, faceDirection);`,
      )
      .replace("#include <dithering_fragment>", `#include <dithering_fragment>\n${keepOwnHue(0.8)}`);
  };
  return material;
}

/**
 * GLSL that rebuilds the lit colour from the surface's own colour at the lit
 * brightness: the scene's blue and magenta rim lights stop tinting it.
 * Insert after `dithering_fragment`; `amount` is how much of it applies.
 */
const keepOwnHue = (amount: number) => /* glsl */ `
  vec3 ownLumaWeights = vec3(0.299, 0.587, 0.114);
  float ownLitLuma = dot(gl_FragColor.rgb, ownLumaWeights);
  float ownAlbedoLuma = max(dot(diffuseColor.rgb, ownLumaWeights), 0.02);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, diffuseColor.rgb * (ownLitLuma / ownAlbedoLuma), ${amount.toFixed(2)});
`;

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
// Planet, after the user's reference (2026-10-06): a soft, matte peach and
// orange globe with gentle bands, inside a wide, thin ring system of fine
// cream and grey-brown bands with gaps and a bright cream outer edge.

/** Ring system inner and outer radius, in planet radii. */
const RING_INNER = 1.3;
const RING_OUTER = 2.25;

function saturnTextures() {
  const random = seeded(11);
  // Surface: soft horizontal bands of peach and orange, blurred together.
  const surface = canvasTexture(1024, 512, (c) => {
    const bands = ["#f4bb8c", "#eeaa78", "#f7c99e", "#e9a06d", "#f9d3ac", "#f0b383", "#f5c091"];
    let y = 0;
    while (y < 512) {
      const height = 14 + random() * 46;
      c.fillStyle = bands[Math.floor(random() * bands.length)];
      c.fillRect(0, y, 1024, height + 2);
      y += height;
    }
    c.filter = "blur(9px)";
    c.drawImage(c.canvas, 0, 0);
    c.filter = "none";
    // A warmer belt just below the equator, like the reference.
    const belt = c.createLinearGradient(0, 270, 0, 330);
    belt.addColorStop(0, "rgba(255,150,60,0)");
    belt.addColorStop(0.5, "rgba(255,160,80,0.28)");
    belt.addColorStop(1, "rgba(255,150,60,0)");
    c.fillStyle = belt;
    c.fillRect(0, 270, 1024, 60);
  });
  // Rings: concentric bands drawn as circles on a square, matching RingGeometry's planar UVs.
  const rings = canvasTexture(1024, 1024, (c) => {
    const centre = 512;
    const outer = 512;
    const inner = outer * (RING_INNER / RING_OUTER);
    // Broad bands of slightly different tone (a smooth random walk, so no
    // fine repeating pattern that would shimmer as moiré).
    const steps = Array.from({ length: 40 }, () => random() - 0.5);
    const band = (t: number) => {
      const x = t * (steps.length - 1);
      const i = Math.floor(x);
      const f = x - i;
      return steps[i] * (1 - f) + (steps[i + 1] ?? steps[i]) * f;
    };
    for (let r = outer; r > inner; r -= 1) {
      const t = (r - inner) / (outer - inner);
      // Inner rings dim and grey-brown, the outer half brighter cream, a bright rim at the edge.
      let alpha = 0.3 + t * 0.55;
      let tone = 0.5 + t * 0.42 + band(t) * 0.16;
      if (t > 0.92) {
        tone = 0.98;
        alpha = 0.95;
      }
      // Gaps: a wide dark one (like the Cassini division) and a thin one near the edge.
      if (Math.abs(t - 0.62) < 0.035) alpha *= 0.12;
      if (Math.abs(t - 0.885) < 0.008) alpha *= 0.2;
      const warm = new THREE.Color().setRGB(0.62, 0.56, 0.48).lerp(new THREE.Color().setRGB(0.97, 0.91, 0.8), Math.min(1, tone));
      c.globalAlpha = Math.min(1, alpha);
      c.strokeStyle = `rgb(${Math.round(warm.r * 255)},${Math.round(warm.g * 255)},${Math.round(warm.b * 255)})`;
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(centre, centre, r, 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
  });
  return { surface, rings };
}

function buildPlanet() {
  const planet = new THREE.Group();
  const textures = saturnTextures();
  // Matte, no gloss: soft like the reference, no reflections across the surface.
  const surface = new THREE.MeshStandardMaterial({ map: textures.surface, roughness: 0.9, metalness: 0 });
  surface.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", `#include <dithering_fragment>\n${keepOwnHue(0.7)}`);
  };
  const system = new THREE.Group();
  // The whole system leans a little, the ring tipped toward the visitor.
  system.rotation.z = -0.24;
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), surface);
  system.add(body);
  // Rings: unlit and softly self-bright, as in the reference; drawn in depth
  // order with the globe, so the far side passes behind it.
  const ringMaterial = new THREE.MeshBasicMaterial({ map: textures.rings, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(RING_INNER, RING_OUTER, 160, 1), ringMaterial);
  ring.rotation.x = -Math.PI / 2 + 0.36;
  system.add(ring);
  planet.add(system);
  // A warm glow round the globe.
  const glow = halo(
    canvasTexture(128, 128, (c) => {
      const g = c.createRadialGradient(64, 64, 40, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
    }),
    "#ffae6a",
  );
  glow.scale.setScalar(2.6);
  glow.material.opacity = 0.3;
  glow.renderOrder = -1;
  planet.add(glow);
  return {
    object: planet,
    update(time: number) {
      planet.rotation.z = Math.sin(time * 0.18) * 0.04;
      body.rotation.y = time * 0.08;
    },
  };
}

// ---------------------------------------------------------------------------
// UFO, after the user's references (2026-10-06): a satin silver saucer with
// a bold orange band round the rim, a row of amber lights in dark bezels,
// cyan neon strips and engine ring underneath, a dark cockpit rim and a tall
// glass bubble. Inside, a cute green alien with a big egg-shaped head, huge
// glossy black almond eyes and a tiny smile, one hand waving and the other
// gripping the cockpit rim.

/** A capsule from one point to another (arms, fingers). */
function limb(from: THREE.Vector3, to: THREE.Vector3, radius: number, material: THREE.Material) {
  const length = from.distanceTo(to);
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(0.001, length), 6, 12), material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return mesh;
}

/** A small hand: a flattened palm with three fingers and a thumb, fingers along +y. */
function buildHand(material: THREE.Material, spread = 0.35) {
  const hand = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), material);
  palm.scale.set(1, 1.05, 0.6);
  hand.add(palm);
  [-1, 0, 1].forEach((i) => {
    const angle = i * spread * 0.5;
    const base = new THREE.Vector3(Math.sin(angle) * 0.02, 0.025, 0);
    hand.add(limb(base, base.clone().add(new THREE.Vector3(Math.sin(angle) * 0.045, Math.cos(angle) * 0.045, 0)), 0.011, material));
  });
  hand.add(limb(new THREE.Vector3(-0.025, 0, 0), new THREE.Vector3(-0.055, 0.025, 0.005), 0.011, material));
  return hand;
}

function buildUfo(m: Materials, flare: THREE.Texture) {
  const ufo = new THREE.Group();
  // Hull, radius 1: silver underside, an orange band round the rim, a silver top.
  ufo.add(new THREE.Mesh(softLathe([[0, -0.3], [0.32, -0.28], [0.72, -0.16], [0.97, -0.04]], 64), m.silver));
  ufo.add(new THREE.Mesh(softLathe([[0.96, -0.05], [1.0, -0.02], [1.01, 0.02], [0.99, 0.06], [0.95, 0.08]], 64), m.orange));
  ufo.add(new THREE.Mesh(softLathe([[0.95, 0.075], [0.82, 0.15], [0.64, 0.23], [0.52, 0.27]], 64), m.silver));
  // Dark cockpit rim.
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.05, 16, 64), m.bezel);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.28;
  ufo.add(rim);
  // Cyan neon strip under the band, and the engine ring and glow underneath.
  const strip = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.012, 8, 96), m.neon);
  strip.rotation.x = Math.PI / 2;
  strip.position.y = -0.09;
  ufo.add(strip);
  const engine = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 12, 64), m.neon);
  engine.rotation.x = Math.PI / 2;
  engine.position.y = -0.29;
  ufo.add(engine);
  const engineGlow = halo(flare, "#7fe7ff");
  engineGlow.position.y = -0.34;
  ufo.add(engineGlow);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.05, 32), m.bezel);
  hatch.position.y = -0.3;
  ufo.add(hatch);
  // Amber lights in dark bezels on the upper slope, facing out along it.
  const lamps: Array<{ bulb: THREE.Mesh; glow: THREE.Sprite }> = [];
  const slope = new THREE.Vector3(0.45, 0.89, 0).normalize();
  for (let i = 0; i < 10; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 10) * Math.PI * 2;
    const seat = new THREE.Group();
    seat.position.set(0.8, 0.165, 0);
    seat.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), slope);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.02, 10, 28), m.bezel);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.052, 18, 12), m.amber);
    bulb.scale.z = 0.55;
    seat.add(bezel, bulb);
    const glow = halo(flare, "#ffb340");
    glow.position.set(0, 0, 0.03);
    seat.add(glow);
    pivot.add(seat);
    ufo.add(pivot);
    lamps.push({ bulb, glow });
  }

  // The alien.
  const alien = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.1, 8, 20), m.alien);
  torso.position.y = 0.26;
  alien.add(torso);
  alien.add(limb(new THREE.Vector3(0, 0.33, 0), new THREE.Vector3(0, 0.44, 0), 0.045, m.alien));
  // Head: a wide cranium narrowing to a small chin.
  const head = new THREE.Group();
  head.position.y = 0.58;
  head.add(new THREE.Mesh(softLathe([[0, -0.155], [0.06, -0.145], [0.115, -0.09], [0.16, 0.0], [0.185, 0.09], [0.175, 0.165], [0.12, 0.225], [0, 0.25]], 48), m.alien));
  // Huge glossy black almond eyes, slanted outward, with a highlight each.
  const eyes: THREE.Group[] = [];
  [-1, 1].forEach((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.075, 0.025, 0.13);
    eye.rotation.set(0, side * 0.42, side * 0.45);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 28, 18), m.eyeBlack);
    ball.scale.set(1, 0.62, 0.5);
    eye.add(ball);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), m.glint);
    glint.position.set(-side * 0.025, 0.018, 0.033);
    eye.add(glint);
    head.add(eye);
    eyes.push(eye);
  });
  // Tiny nostrils and a small smile.
  [-1, 1].forEach((side) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), m.alienDark);
    nostril.position.set(side * 0.012, -0.045, 0.165);
    head.add(nostril);
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0055, 8, 20, Math.PI), m.alienDark);
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.085, 0.152);
  head.add(smile);
  alien.add(head);
  // Waving arm (his left, our right), pivoting at the shoulder.
  const shoulder = new THREE.Group();
  shoulder.position.set(0.11, 0.34, 0.03);
  const elbow = new THREE.Vector3(0.09, 0.09, 0.02);
  const wrist = new THREE.Vector3(0.1, 0.2, 0.04);
  shoulder.add(limb(new THREE.Vector3(), elbow, 0.026, m.alien), limb(elbow, wrist, 0.023, m.alien));
  const waveHand = buildHand(m.alien);
  waveHand.position.copy(wrist).add(new THREE.Vector3(0, 0.03, 0));
  shoulder.add(waveHand);
  alien.add(shoulder);
  // The other hand grips the cockpit rim at the front.
  const grip = new THREE.Vector3(-0.2, 0.345, 0.45);
  alien.add(limb(new THREE.Vector3(-0.11, 0.33, 0.04), new THREE.Vector3(-0.15, 0.3, 0.25), 0.026, m.alien));
  alien.add(limb(new THREE.Vector3(-0.15, 0.3, 0.25), grip, 0.023, m.alien));
  const gripHand = buildHand(m.alien, 0.5);
  gripHand.position.copy(grip);
  // Fingers over the rim, pointing out and down.
  gripHand.rotation.set(Math.PI / 2 + 0.5, 0, 0.2);
  alien.add(gripHand);
  ufo.add(alien);

  // Tall glass bubble, sitting in the rim.
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.56, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.6), m.glass);
  dome.position.y = 0.28 + Math.cos(Math.PI * 0.6) * -0.56 * 0.55;
  dome.renderOrder = 2;
  ufo.add(dome);

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
      lamps.forEach(({ glow }, i) => {
        // A gentle shimmer running round the rim.
        const on = (Math.sin(time * 3 - i * 0.7) + 1) / 2;
        glow.scale.setScalar(0.16 + on * 0.1);
        glow.material.opacity = 0.45 + on * 0.4;
      });
      const pulse = (Math.sin(time * 5) + 1) / 2;
      engineGlow.scale.setScalar(0.5 + pulse * 0.25 + beamOn * 0.6);
      engineGlow.material.opacity = 0.5 + beamOn * 0.5;
      // The saucer turns; the alien keeps facing the visitor, looking around a little.
      alien.rotation.y = -ufo.rotation.y + Math.sin(time * 0.7) * 0.22;
      head.rotation.set(0.12 + Math.sin(time * 0.9) * 0.04, 0, Math.sin(time * 0.6) * 0.06);
      // Waving: the whole arm swings from the shoulder, the hand flaps a little more.
      shoulder.rotation.z = -0.15 - wave * (0.5 + Math.sin(time * 9) * 0.35);
      waveHand.rotation.z = wave * Math.sin(time * 9 - 0.6) * 0.35;
      torso.scale.set(1 + Math.sin(time * 2.3) * 0.02, 1 - Math.sin(time * 2.3) * 0.03, 1);
      // A blink every few seconds.
      const blinking = time % 3.7 < 0.12 ? 0.12 : 1;
      eyes.forEach((eye) => eye.scale.set(1, blinking, 1));
    },
  };
}

// ---------------------------------------------------------------------------
// Crystal stars: a sharp four-point star cut in flat facets. Each arm is a
// ridge running from the raised centre out to its tip, on both sides, so
// every facet catches the light like cut glass.

function sparkleGeometry() {
  const tips = 4;
  const valley = 0.3;
  const peak = 0.36;
  const top = new THREE.Vector3(0, 0, peak);
  const bottom = new THREE.Vector3(0, 0, -peak);
  const outline: THREE.Vector3[] = [];
  for (let i = 0; i < tips; i++) {
    const a = (i / tips) * Math.PI * 2 + Math.PI / 2;
    const between = a + Math.PI / tips;
    outline.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0), new THREE.Vector3(Math.cos(between) * valley, Math.sin(between) * valley, 0));
  }
  const positions: number[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    // One facet up to the top centre, one down to the bottom centre (wound to face out).
    positions.push(...a.toArray(), ...b.toArray(), ...top.toArray());
    positions.push(...b.toArray(), ...a.toArray(), ...bottom.toArray());
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
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
    const planet = buildPlanet();
    const ufo = buildUfo(m, flare);
    const asteroids = ASTEROIDS.map((spec, i) => {
      const mesh = new THREE.Mesh(rocks[i % rocks.length], m.rock);
      mesh.rotation.set(spec.seed, spec.seed * 2, 0);
      return { spec, mesh };
    });
    const kickRock = new THREE.Mesh(rocks[1], m.rock);
    const starShape = sparkleGeometry();
    // A star: the crystal plus a soft lilac glow with a four-point flare.
    const star = (i: number) => {
      const group = new THREE.Group();
      const blue = i % 3 === 0;
      group.add(new THREE.Mesh(starShape, blue ? m.crystalBlue : m.crystal));
      const glow = halo(flare, blue ? "#b9c6ff" : "#d2bfff");
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
    // Its top meets his soles: centre one rock radius below his feet (the
    // rock is about 0.9 of its size tall from the middle), plus room for his bob.
    const rockSize = 0.2 * K;
    const nearHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    const rockRadius = (rockSize * 0.9) / nearHeight;
    const rock = kickRockAt(j, s.novaFeetFy + rockRadius + 0.025);
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

    /** Turns a crystal star slowly so its facets catch the light, with a soft glow and the odd glint. */
    const shine = (group: THREE.Object3D, glow: THREE.Sprite, seed: number) => {
      const twinkle = (Math.sin(time * 2.4 + seed * 1.7) + 1) / 2;
      // A bright glint every couple of seconds, on top of a steady twinkle.
      const flash = Math.max(0, Math.sin(time * 1.6 + seed * 2.3)) ** 10;
      group.rotation.set(Math.sin(time * 0.5 + seed) * 0.5, time * 0.35 + seed, Math.sin(time * 0.3 + seed) * 0.25);
      glow.material.opacity = 0.4 + twinkle * 0.25 + flash * 0.6;
      glow.scale.setScalar(2.6 + twinkle * 0.8 + flash * 3);
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
