"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { pointer, pointerIsActive, trackPointer } from "@/lib/pointer";
import { gsap } from "@/lib/gsap";
import { clamp } from "@/lib/utils";
import { LIGHTS, createBeacon, createStudioScene, createSuitScene, dressNova } from "./nova-look";
import { AXIS, captureRest, findBones, patchRig, poseBone, slideSeams } from "./nova-rig";
import { emptyTrickState, nextTrick, playTrick, settleTricks, type TrickName } from "./nova-tricks";

const MODEL_URL = "/models/nova.glb";
/** The model is Meshopt-compressed (npm run model:nova). */
const withMeshopt = (loader: GLTFLoader) => void loader.setMeshoptDecoder(MeshoptDecoder);
/** Model height in its own units (origin at the feet) */
const MODEL_HEIGHT = 0.78;
const TURN = Math.PI * 2;
/** Seconds between tricks: the first one, then a random gap in this range */
const FIRST_TRICK = 1.5;
const TRICK_GAP = [1.8, 4] as const;
/** How close he comes to the screen during the entrance flip, as a scale multiplier */
const ENTRANCE_CLOSEST = 2.2;
/** Canvas stacking (page mode): behind the banner text (z-2) while he flies in, then over everything */
const LAYER_BEHIND = "1";
const LAYER_FRONT = "40";
/** Clicks on these never start a trick: they do their own thing. */
const INTERACTIVE = "a, button, input, select, textarea, label, [role='button']";

/** A damped spring for one animated value: lags its target and overshoots a little. */
type Spring = { value: number; velocity: number };
function springTo(spring: Spring, target: number, stiffness: number, damping: number, dt: number) {
  const c = 2 * Math.sqrt(stiffness) * damping;
  spring.velocity += (stiffness * (target - spring.value) - c * spring.velocity) * dt;
  spring.value += spring.velocity * dt;
  return spring.value;
}

/** Smooth noise in about -1..1: three sines at unrelated speeds, so motion never visibly loops. */
const wobble = (t: number, seed: number) =>
  (Math.sin(t + seed * 1.7) + Math.sin(t * 2.13 + seed * 3.1) * 0.55 + Math.sin(t * 3.37 + seed * 5.3) * 0.3) / 1.85;

export type NovaStageProps = {
  /** `page`: fixed over the viewport, leaves with scroll. `box`: fills its parent (the lab). */
  mode?: "page" | "box";
  /** Element whose scroll-out takes Nova off screen (page mode) */
  scrollOutSelector?: string;
  /** Space Nova keeps clear at the top and bottom, in px (menu, logo band) */
  insetTop?: number;
  insetBottom?: number;
  /** Nova's height in px */
  height: number;
  /** Follow the pointer (off on touch screens) */
  follow?: boolean;
  /** Seconds before the entrance starts */
  enterDelay?: number;
};

type Motion = {
  position: THREE.Vector2;
  velocity: THREE.Vector2;
  target: THREE.Vector2;
  bank: number;
  pitch: number;
  yaw: number;
  tumble: number;
  lookX: number;
  lookY: number;
  wander: number;
  antenna: number[];
  antennaVelocity: number[];
  /** Smoothed acceleration in px per second squared, for follow-through */
  acceleration: THREE.Vector2;
  previousVelocity: THREE.Vector2;
  /** One spring per animated bone channel */
  springs: Record<string, Spring>;
  scroll: number;
  entered: boolean;
};

/** Studio lighting generated locally (no HDR download): see nova-look.ts. */
function Studio() {
  const gl = useThree((state) => state.gl);
  const environment = useMemo(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const texture = generator.fromScene(createStudioScene(), 0.03).texture;
    generator.dispose();
    return texture;
  }, [gl]);
  useEffect(() => () => environment.dispose(), [environment]);
  return (
    <>
      <primitive object={environment} attach="environment" />
      {Object.values(LIGHTS).map((light) => (
        <directionalLight key={light.color} color={light.color} intensity={light.intensity} position={light.position} />
      ))}
    </>
  );
}

function Nova({
  mode,
  scrollOutSelector,
  insetTop = 0,
  insetBottom = 0,
  height,
  follow = true,
  enterDelay = 0,
}: NovaStageProps) {
  const { scene } = useLoader(GLTFLoader, MODEL_URL, withMeshopt);
  const root = useRef<THREE.Group>(null);

  const gl = useThree((state) => state.gl);
  // The suit reflects its own studio (blue and magenta soft boxes, no warm
  // horizon); the visor keeps the scene environment from <Studio>.
  const suitEnvironment = useMemo(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const texture = generator.fromScene(createSuitScene(), 0.04).texture;
    generator.dispose();
    return texture;
  }, [gl]);
  useEffect(() => () => suitEnvironment.dispose(), [suitEnvironment]);

  const { model, bones, rest, beacon } = useMemo(() => {
    const model = cloneSkinned(scene);
    const bones = findBones(model);
    patchRig(model, bones);
    dressNova(model, suitEnvironment);
    return { model, bones, rest: captureRest(bones), beacon: createBeacon(model) };
  }, [scene, suitEnvironment]);

  const tricks = useRef(emptyTrickState());
  // Links and buttons on screen, in canvas px, refreshed a few times a second.
  const obstacles = useRef({ rects: [] as DOMRect[], checkedAt: -1 });
  // Tricks run on their own clock, whether or not the pointer moves. `run`
  // tells an interrupted trick's completion apart from the current one's.
  const trickClock = useRef({ now: 0, nextAt: FIRST_TRICK, previous: null as TrickName | null, playing: false, run: 0 });
  const startedAt = useRef<number | null>(null);
  // The entrance: a GSAP timeline drives his place on screen (px), his depth
  // (`zoom`, a scale multiplier: 0 is far away, above 1 is close to the
  // screen), how much of the flying pose he holds (`fly`), his heading
  // (`roll`, radians in the screen plane) and whether he is behind the text.
  const entrance = useRef({
    active: true,
    x: 0,
    y: 0,
    zoom: 0,
    fly: 1,
    roll: 0,
    behind: true,
    timeline: null as gsap.core.Timeline | null,
  });
  useEffect(
    () => () => {
      // Unmounted mid-entrance (or remounted in development): start it over next time.
      entrance.current.timeline?.kill();
      Object.assign(entrance.current, { active: true, timeline: null });
      startedAt.current = null;
    },
    [],
  );

  const motion = useRef<Motion>({
    position: new THREE.Vector2(),
    velocity: new THREE.Vector2(),
    target: new THREE.Vector2(),
    bank: 0,
    pitch: 0,
    yaw: 0,
    tumble: 0,
    lookX: 0,
    lookY: 0,
    wander: 0,
    antenna: [0, 0, 0],
    antennaVelocity: [0, 0, 0],
    acceleration: new THREE.Vector2(),
    previousVelocity: new THREE.Vector2(),
    springs: {},
    scroll: 0,
    entered: false,
  });

  useEffect(() => {
    trackPointer();
    const clock = trickClock.current;
    // Plays a trick now, cutting short the one in progress.
    const start = (name: TrickName) => {
      const run = ++clock.run;
      clock.playing = true;
      clock.previous = name;
      settleTricks(tricks.current, 0.2).then(() =>
        playTrick(name, tricks.current).then(() => {
          if (run !== clock.run) return;
          clock.playing = false;
          clock.nextAt = clock.now + THREE.MathUtils.randFloat(...TRICK_GAP);
        }),
      );
    };
    const onTrick = (event: Event) => start((event as CustomEvent<TrickName>).detail);
    const onClick = (event: PointerEvent) => {
      if (entrance.current.active) return;
      if (event.button !== 0 || (event.target as Element | null)?.closest?.(INTERACTIVE)) return;
      start(nextTrick(clock.previous));
    };
    window.addEventListener("nova:trick", onTrick);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("nova:trick", onTrick);
      window.removeEventListener("pointerdown", onClick);
    };
  }, []);

  // Development only: lets the lab freeze Nova and pose him from the console.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const debug = {
      freeze: false,
      motion: motion.current,
      tricks: tricks.current,
      group: () => root.current,
      /** Rest pose, facing the camera, centered, `zoom` times larger */
      reset(zoom = 1) {
        debug.freeze = true;
        const group = root.current;
        if (!group) return;
        group.rotation.set(0, 0, 0);
        group.position.set(0, 0, 0);
        group.scale.setScalar(group.userData.baseScale * zoom);
        group.updateMatrixWorld();
        for (const [bone, quaternion] of rest) bone.quaternion.copy(quaternion);
      },
      /** Rotates one bone around one of Nova's axes, in radians */
      pose(key: keyof typeof bones, axis: keyof typeof AXIS, angle: number) {
        if (root.current) poseBone(bones[key], rest, root.current, [[AXIS[axis], angle]]);
      },
      /** Moves the shoulder seams to match the posed arms */
      slide() {
        if (root.current) slideSeams(model, root.current);
      },
    };
    (window as unknown as { __nova?: typeof debug }).__nova = debug;
  }, [bones, rest, model]);

  useFrame((state, rawDelta) => {
    const group = root.current;
    if (!group) return;
    if ((window as unknown as { __nova?: { freeze: boolean } }).__nova?.freeze) return;
    const dt = Math.min(rawDelta, 1 / 30);
    const time = state.clock.elapsedTime;
    const m = motion.current;
    const s = tricks.current;

    // Canvas geometry: px of the canvas and world units per px at z = 0.
    const rect = state.gl.domElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const viewport = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
    const unit = viewport.height / h;
    const novaH = height;
    const novaW = novaH * 0.7;

    // Margins cover his arm span and the turn sweep, so no limb leaves the screen.
    const bounds = {
      left: novaW * 0.85,
      right: w - novaW * 0.85,
      top: insetTop + novaH * 0.55,
      bottom: Math.max(insetTop + novaH * 0.6, h - insetBottom - novaH * 0.5),
    };

    // Wander: two slow sine pairs make a path that never repeats exactly.
    const wanderTarget = (t: number, out: THREE.Vector2) => {
      const cx = (bounds.left + bounds.right) / 2;
      const cy = (bounds.top + bounds.bottom) / 2;
      const ax = (bounds.right - bounds.left) / 2;
      const ay = (bounds.bottom - bounds.top) / 2;
      return out.set(
        cx + ax * (0.62 * Math.sin(t * 0.15) + 0.38 * Math.sin(t * 0.31 + 1.3)),
        cy + ay * (0.6 * Math.sin(t * 0.12 + 0.7) + 0.4 * Math.sin(t * 0.26)),
      );
    };

    // Entrance: from far away in the top-right corner he flies head first,
    // arms tight to his body, down to the bottom middle, behind the text.
    // There he comes over everything and front-flips up to the middle of the
    // banner, coming close to the screen on the way, then waves hello.
    // Tricks, following and wandering start once he is done.
    const e = entrance.current;
    if (startedAt.current === null) {
      startedAt.current = time + enterDelay;
      m.wander = Math.random() * 100;
      const start = new THREE.Vector2(w - novaW * 0.3, insetTop + novaH * 0.15);
      const low = new THREE.Vector2(w * 0.5, bounds.bottom);
      const middle = new THREE.Vector2(w * 0.5, (bounds.top + bounds.bottom) / 2);
      // Heading: his head points along the flight, eased toward level like a
      // flying hero rather than a straight dive. Screen y points down.
      const heading = Math.atan2(-(low.x - start.x), -(low.y - start.y)) * 0.8;
      const clock = trickClock.current;
      clock.playing = true;
      Object.assign(e, { x: start.x, y: start.y, zoom: 0, fly: 1, roll: heading, behind: true });
      e.timeline = gsap
        .timeline({
          delay: enterDelay,
          onComplete: () => {
            e.active = false;
            m.entered = true;
            m.position.set(e.x, e.y);
            m.velocity.set(0, 0);
            clock.playing = false;
            clock.nextAt = clock.now + THREE.MathUtils.randFloat(...TRICK_GAP);
          },
        })
        // Fly in behind the text, growing from a speck, slowing as he arrives.
        .to(e, { x: low.x, y: low.y, duration: 2.1, ease: "power2.out" }, 0)
        .to(e, { zoom: 1.15, duration: 2.1, ease: "power1.in" }, 0)
        // Pull up: level out and come in front of everything.
        .set(e, { behind: false }, 1.95)
        .to(e, { roll: 0, fly: 0, duration: 0.45, ease: "power2.inOut" }, 1.85)
        // Front flip up to the middle, close to the screen at the top of the arc.
        .to(e, { x: middle.x, duration: 1.5, ease: "power1.inOut" }, 2.1)
        .to(e, { y: middle.y, duration: 1.5, ease: "power2.out" }, 2.1)
        .to(e, { zoom: ENTRANCE_CLOSEST, duration: 0.75, ease: "sine.out" }, 2.1)
        .to(e, { zoom: 1, duration: 0.75, ease: "sine.inOut" }, 2.85)
        .to(s, { flip: 1, duration: 1.5, ease: "power2.inOut" }, 2.1)
        .to(s, { tuck: 1, duration: 0.5, ease: "power2.out", yoyo: true, repeat: 1, repeatDelay: 0.3 }, 2.15)
        .set(s, { flip: 0 }, 3.6)
        // Hello.
        .to(s, { armR: 1, wave: 1, duration: 0.45, ease: "power2.out" }, 3.55)
        .to(s, { armR: 0, wave: 0, duration: 0.5, ease: "power2.inOut" }, 4.75);
    }
    // Page mode: the canvas sits behind the banner text while he flies in.
    if (mode === "page") {
      const layer = state.gl.domElement.parentElement?.parentElement;
      const z = e.active && e.behind ? LAYER_BEHIND : LAYER_FRONT;
      if (layer && layer.style.zIndex !== z) layer.style.zIndex = z;
    }
    if (time < startedAt.current) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Pointer in canvas space.
    const px = pointer.x - rect.left;
    const py = pointer.y - rect.top;
    const pointerInside = px >= 0 && px <= w && py >= 0 && py <= h;
    const following = follow && m.entered && pointerIsActive(2500) && pointerInside;

    // Where Nova wants to be.
    if (following && pointer.interactive) {
      // Step aside so the link or button under the pointer stays clear.
      const r = pointer.interactive.getBoundingClientRect();
      const roomRight = w - (r.right - rect.left);
      const sideX = roomRight > novaW * 1.4 ? r.right - rect.left + novaW * 0.75 : r.left - rect.left - novaW * 0.75;
      m.target.set(sideX, r.top - rect.top + r.height / 2);
    } else if (following) {
      // Hover beside the pointer, never on it.
      const dx = m.position.x - px;
      const dy = m.position.y - py;
      const distance = Math.hypot(dx, dy) || 1;
      const keep = novaH * 0.55;
      m.target.set(px + (dx / distance) * keep, py + (dy / distance) * keep);
    } else {
      if (!e.active) m.wander += dt;
      wanderTarget(m.wander, m.target);
    }
    // Never settle over a link or button: push the target out of any control
    // (grown by half his size) along the shortest way out.
    if (time - obstacles.current.checkedAt > 0.3) {
      obstacles.current.checkedAt = time;
      obstacles.current.rects = Array.from(document.querySelectorAll("a, button"))
        .map((node) => node.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.bottom > rect.top && r.top < rect.bottom && r.right > rect.left && r.left < rect.right);
    }
    const padX = novaW * 0.6;
    const padY = novaH * 0.55;
    for (const r of obstacles.current.rects) {
      const left = r.left - rect.left - padX;
      const right = r.right - rect.left + padX;
      const top = r.top - rect.top - padY;
      const bottom = r.bottom - rect.top + padY;
      const { x, y } = m.target;
      if (x <= left || x >= right || y <= top || y >= bottom) continue;
      const exits = [x - left, right - x, y - top, bottom - y];
      const shortest = exits.indexOf(Math.min(...exits));
      if (shortest === 0) m.target.x = left;
      else if (shortest === 1) m.target.x = right;
      else if (shortest === 2) m.target.y = top;
      else m.target.y = bottom;
    }
    m.target.set(clamp(m.target.x, bounds.left, bounds.right), clamp(m.target.y, bounds.top, bounds.bottom));

    if (e.active) {
      // The entrance timeline places him; velocity still feeds his lean and drag.
      m.velocity.set((e.x - m.position.x) / dt, (e.y - m.position.y) / dt);
      if (!m.position.lengthSq()) m.velocity.set(0, 0);
      m.position.set(e.x, e.y);
    } else {
      // Damped spring toward the target: soft lag, no snapping.
      const stiffness = following ? 6 : 3;
      const damping = 2 * Math.sqrt(stiffness) * 0.9;
      m.velocity.x += (stiffness * (m.target.x - m.position.x) - damping * m.velocity.x) * dt;
      m.velocity.y += (stiffness * (m.target.y - m.position.y) - damping * m.velocity.y) * dt;
      m.position.x += m.velocity.x * dt;
      m.position.y += m.velocity.y * dt;
    }

    // Tricks every few seconds, while he follows the pointer or not.
    const clock = trickClock.current;
    clock.now = time;
    if (m.entered && !clock.playing && time > clock.nextAt) {
      const run = ++clock.run;
      clock.playing = true;
      clock.previous = nextTrick(clock.previous);
      playTrick(clock.previous, s).then(() => {
        if (run !== clock.run) return;
        clock.playing = false;
        clock.nextAt = clock.now + THREE.MathUtils.randFloat(...TRICK_GAP);
      });
    }

    // Body attitude from velocity (px per second), smoothed.
    const vx = m.velocity.x;
    const vy = m.velocity.y;
    // Acceleration drives follow-through: limbs swing against sudden changes.
    m.acceleration.x = THREE.MathUtils.damp(m.acceleration.x, (vx - m.previousVelocity.x) / dt, 8, dt);
    m.acceleration.y = THREE.MathUtils.damp(m.acceleration.y, (vy - m.previousVelocity.y) / dt, 8, dt);
    m.previousVelocity.set(vx, vy);
    // During the entrance the timeline sets his heading, so no banking from speed.
    const steer = e.active ? 0 : 1;
    m.bank = THREE.MathUtils.damp(m.bank, clamp(-vx * 0.0011, -0.55, 0.55) * steer, 6, dt);
    m.pitch = THREE.MathUtils.damp(m.pitch, clamp(vy * 0.0007, -0.4, 0.4) * steer, 6, dt);
    const yawGoal = following ? clamp(((px - m.position.x) / w) * 1.6, -0.6, 0.6) : clamp(vx * 0.0012, -0.5, 0.5);
    m.yaw = THREE.MathUtils.damp(m.yaw, yawGoal, 3, dt);
    m.tumble = THREE.MathUtils.damp(m.tumble, 0, 1.4, dt);

    // Where he looks: the pointer when it moves, otherwise ahead of himself.
    const lookGoalX = following ? (px - m.position.x) / w : clamp(vx * 0.002, -0.3, 0.3);
    const lookGoalY = following ? (py - m.position.y) / h : 0;
    m.lookX = THREE.MathUtils.damp(m.lookX, clamp(lookGoalX * 2, -1, 1), 5, dt);
    m.lookY = THREE.MathUtils.damp(m.lookY, clamp(lookGoalY * 2, -1, 1), 5, dt);

    // Scroll-out (page mode): float up and off as the banner leaves.
    if (mode === "page" && scrollOutSelector) {
      const banner = document.querySelector(scrollOutSelector);
      const progress = banner ? clamp(-banner.getBoundingClientRect().top / banner.clientHeight, 0, 1) : 0;
      m.scroll = THREE.MathUtils.damp(m.scroll, progress, 10, dt);
    }

    // Zero-g float on top of everything.
    const bobX = wobble(time * 0.55, 21) * novaH * 0.04;
    const bobY = wobble(time * 0.8, 22) * novaH * 0.06;
    const drawX = m.position.x + bobX;
    const lifted = m.position.y + bobY - s.lift * novaH;
    const drawY = lifted - m.scroll * (lifted + novaH * 1.2);

    group.position.set((drawX - w / 2) * unit, -(drawY - h / 2) * unit, 0);
    group.userData.baseScale = (novaH * unit) / MODEL_HEIGHT;
    // Depth: the entrance zoom, and a slight drift toward and away from the screen.
    const depth = e.active ? e.zoom : 1 + wobble(time * 0.3, 24) * 0.04;
    group.scale.setScalar(group.userData.baseScale * depth);
    // Whole-body drift: slow, never-repeating roll, pitch and turn on top of the motion.
    // Kept low during the entrance so he faces the user as he arrives and waves.
    const drift = e.active ? 0.25 : following ? 0.5 : 1;
    // A slow sweep turns him far enough to show his side now and then.
    const turn = wobble(time * 0.4, 2) * 0.3 + wobble(time * 0.13, 23) * 0.75;
    group.rotation.set(
      m.pitch + s.flip * TURN + wobble(time * 0.5, 1) * 0.15 * drift,
      m.yaw + s.spin * TURN + turn * drift,
      m.bank + m.tumble + (e.active ? e.roll : 0) + s.roll * TURN + wobble(time * 0.6, 3) * 0.2 * drift + m.scroll * 0.5,
    );
    group.updateMatrixWorld();

    // Bones, parent first. Directions in Nova's own space (checked in the lab):
    // arms and legs move away from the body on +z (left) and -z (right); a leg
    // swings forward on -x; knees and elbows bend on +x and +-z.
    // Every channel runs through a spring, so motion lags, overshoots and
    // settles: the body leads, the limbs follow.
    const b = bones;
    // Flying pose during the entrance: arms tight along the body, legs
    // together and trailing, head up into the flight.
    const fly = e.active ? e.fly : 0;
    const idle = (following ? 0.6 : 1) * (1 - fly);
    const breath = Math.sin(time * 1.5);
    const tuck = s.tuck;
    const spring = (key: string, target: number, stiffness = 26, damping = 0.42) =>
      springTo((m.springs[key] ??= { value: 0, velocity: 0 }), target, stiffness, damping, dt);

    // Follow-through from velocity (drag) and acceleration (whip), screen px based.
    const dragX = clamp(-vx * 0.0008, -0.45, 0.45);
    const dragY = clamp(vy * 0.0012, -0.5, 0.5);
    const whipX = clamp(-m.acceleration.x * 0.00018, -0.5, 0.5);
    const whipY = clamp(m.acceleration.y * 0.00025, -0.5, 0.5);

    const lean = spring("lean", clamp(m.lookX * 0.18 + m.bank * 0.25, -0.35, 0.35) + wobble(time * 0.9, 4) * 0.1 * idle + whipX * 0.35, 18, 0.5);
    const hunch = spring("hunch", breath * 0.035 - tuck * 0.3 + whipY * 0.2 - fly * 0.1, 18, 0.5);
    poseBone(b.spine1, rest, group, [[AXIS.z, lean], [AXIS.x, hunch]]);

    // Head: the mouse when it moves, otherwise a curious look around.
    const roam = following || e.active ? 0 : wobble(time * 0.35, 5) * 0.45;
    // The head is the top of the body, so a look turns the upper spine, with
    // a curious tilt toward the side he looks at. Almost all of it goes on
    // Spine.02: the visor and the backpack span both upper spine bones, and
    // turning them by different amounts shears the glass and bends the pack.
    const look = spring("look", clamp(m.lookX * 0.7 + s.look * 0.8 + roam, -1, 1) * 0.6 + wobble(time * 0.6, 15) * 0.06, 12, 0.5);
    const nod = spring("nod", m.lookY * 0.2 - breath * 0.02 + wobble(time * 0.5, 6) * 0.07 - whipY * 0.1 - fly * 0.3, 14, 0.5);
    const tilt = spring("tilt", -look * 0.15 + wobble(time * 0.45, 16) * 0.05 - whipX * 0.1, 12, 0.45);
    poseBone(b.spine2, rest, group, [[AXIS.y, look * 0.9], [AXIS.x, nod * 0.85], [AXIS.z, tilt * 0.85]]);
    poseBone(b.spine3, rest, group, [[AXIS.y, look * 0.1], [AXIS.x, nod * 0.15], [AXIS.z, tilt * 0.15]]);

    // Arms: a lazy alternating stroke plus drift, dragged by the motion.
    // Raises stop near horizontal: higher, the shoulders fold into the body.
    const raise = (amount: number) => clamp(amount, -0.38, 1.45);
    const stroke = Math.sin(time * 1.2);
    const wave = s.wave * Math.sin(time * 9) * 0.5;
    const armLz = spring("armLz", raise(0.22 + wobble(time * 0.8, 7) * 0.2 * idle + dragY * 0.6 + whipY * 0.5 + s.armL * 1.3 - tuck * 0.1 - fly * 0.6) + dragX * (1 - fly) + whipX * (1 - fly), 22, 0.35);
    const armRz = spring("armRz", -raise(0.22 + wobble(time * 0.8, 8) * 0.2 * idle + dragY * 0.6 + whipY * 0.5 + s.armR * 1.3 - tuck * 0.1 - fly * 0.6) + dragX * (1 - fly) + whipX * (1 - fly), 22, 0.35);
    const armLx = spring("armLx", stroke * 0.2 * idle + wobble(time * 0.7, 9) * 0.1 - tuck * 0.25, 20, 0.4);
    const armRx = spring("armRx", -stroke * 0.2 * idle + wobble(time * 0.7, 10) * 0.1 - tuck * 0.25, 20, 0.4);
    poseBone(b.armL1, rest, group, [[AXIS.z, armLz], [AXIS.x, armLx]]);
    poseBone(b.armR1, rest, group, [[AXIS.z, armRz], [AXIS.x, armRx]]);
    const elbowL = spring("elbowL", 0.4 + wobble(time, 11) * 0.25 * idle + tuck * 0.4 + Math.max(0, stroke) * 0.15 * idle - fly * 0.3, 30, 0.35);
    const elbowR = spring("elbowR", 0.4 + wobble(time, 12) * 0.25 * idle + tuck * 0.4 + Math.max(0, -stroke) * 0.15 * idle + s.wave * 0.6 - fly * 0.3, 30, 0.35);
    poseBone(b.armL2, rest, group, [[AXIS.z, elbowL]]);
    poseBone(b.armR2, rest, group, [[AXIS.z, -(elbowR + wave)]]);
    poseBone(b.handL, rest, group, [[AXIS.z, spring("handL", wobble(time * 1.2, 13) * 0.35 + whipX * 0.4, 40, 0.3)]]);
    poseBone(b.handR, rest, group, [[AXIS.z, spring("handR", wobble(time * 1.2, 14) * 0.35 + whipX * 0.4, 40, 0.3)]]);
    slideSeams(model, group);

    // Legs: an alternating swim kick with knees, drifting apart, trailing the
    // motion; tucked in during flips.
    const kick = Math.sin(time * 1.6);
    const spread = 0.1 + wobble(time * 0.6, 15) * 0.08;
    const legL = spring("legL", -kick * 0.36 * idle - tuck * 0.95 - (dragY * 0.25 + whipY * 0.3) * (1 - fly) + fly * 0.2, 20, 0.4);
    const legR = spring("legR", kick * 0.36 * idle - tuck * 0.95 - (dragY * 0.25 + whipY * 0.3) * (1 - fly) + fly * 0.2, 20, 0.4);
    const together = spread * (1 - fly) - fly * 0.04;
    const legLz = spring("legLz", together + (dragX * 0.9 + whipX * 0.6) * (1 - fly), 18, 0.4);
    const legRz = spring("legRz", -together + (dragX * 0.9 + whipX * 0.6) * (1 - fly), 18, 0.4);
    poseBone(b.legL, rest, group, [[AXIS.x, legL], [AXIS.z, legLz]]);
    poseBone(b.legR, rest, group, [[AXIS.x, legR], [AXIS.z, legRz]]);
    poseBone(b.legL2, rest, group, [[AXIS.x, spring("kneeL", 0.15 + Math.max(0, kick) * 0.45 * idle + tuck * 1.2 + fly * 0.05, 26, 0.4)]]);
    poseBone(b.legR2, rest, group, [[AXIS.x, spring("kneeR", 0.15 + Math.max(0, -kick) * 0.45 * idle + tuck * 1.2 + fly * 0.05, 26, 0.4)]]);

    // Antenna: each segment springs after the one below it.
    const antennaGoal = clamp(vx * 0.0016 + m.bank * 0.4, -0.7, 0.7);
    const segments = [b.anten1, b.anten2, b.anten3];
    let previous = antennaGoal;
    segments.forEach((bone, i) => {
      const k = 60 - i * 15;
      const c = 2 * Math.sqrt(k) * 0.35;
      m.antennaVelocity[i] += (k * (previous - m.antenna[i]) - c * m.antennaVelocity[i]) * dt;
      m.antenna[i] += m.antennaVelocity[i] * dt;
      previous = m.antenna[i] * 0.8;
      poseBone(bone, rest, group, [[AXIS.z, m.antenna[i] * 0.45]]);
    });

    beacon.update(time);
  });

  return (
    <group ref={root} visible={false}>
      <group position={[0, -MODEL_HEIGHT / 2, 0]}>
        <primitive object={model} />
      </group>
    </group>
  );
}

/** If anything in the 3D scene fails, the page carries on without Nova. */
class NovaBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[nova] scene failed, continuing without Nova:", error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The 3D canvas with Nova. Loaded lazily by NovaLayer; never server-rendered. */
export default function NovaStage(props: NovaStageProps) {
  const { mode = "page", scrollOutSelector } = props;
  const [active, setActive] = useState(true);

  // Stop rendering once the banner has scrolled away (page mode).
  useEffect(() => {
    if (mode !== "page" || !scrollOutSelector) return;
    const update = () => {
      const banner = document.querySelector(scrollOutSelector);
      if (!banner) return;
      // Keep rendering a little past the banner so a fast scroll never
      // freezes him half visible; by then he is fully off screen.
      setActive(banner.getBoundingClientRect().bottom > -window.innerHeight * 0.6);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [mode, scrollOutSelector]);

  return (
    <Canvas
      style={
        mode === "page"
          ? { position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }
          : { position: "absolute", inset: 0, pointerEvents: "none" }
      }
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.05 }}
      camera={{ fov: 30, position: [0, 0, 10], near: 0.1, far: 50 }}
      aria-hidden
    >
      <Studio />
      <NovaBoundary>
        <Suspense fallback={null}>
          <Nova {...props} />
        </Suspense>
      </NovaBoundary>
    </Canvas>
  );
}

useLoader.preload(GLTFLoader, MODEL_URL, withMeshopt);
