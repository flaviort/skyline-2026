"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { pointer, pointerIsActive, trackPointer } from "@/lib/pointer";
import { tilt as phoneTilt, tiltIsActive, trackTilt } from "@/lib/tilt";
import { gsap } from "@/lib/gsap";
import { whenPageReady } from "@/lib/page-ready";
import { clamp } from "@/lib/utils";
import { LIGHTS, createBeacon, createStudioScene, createSuitScene, dressNova } from "./nova-look";
import { ARM_REST_LIFT, AXIS, captureRest, findBones, poseBone } from "./nova-rig";
import { emptyTrickState, nextTrick, playTrick, settleTricks, type TrickName } from "./nova-tricks";
import { SpaceCast, createJourneyState, type JourneyState } from "./space-cast";
import { CAMERA_FOV, CAMERA_Z, bump, easeInOut, novaAt, range, toWorld, type NovaCue } from "./space-journey";

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
/** How fast the forearm swings in a wave (radians per second: 10 is about 1.6 swings a second) */
const WAVE_SPEED = 10;
/** How far the hand slides out of the sleeve in a wave, as a share of the forearm's length */
const WAVE_HAND_REACH = 0.3;
/** How far the thumb moves up the hand during a wave, as a share of the way to the fingers' base */
const WAVE_THUMB_LIFT = 0.5;
/** His size at the end of the flight in, as a scale multiplier: small enough to stay under the text */
const ENTRANCE_FLIGHT_SIZE = 0.55;
/** How far he is tipped head first toward the viewer while flying in (radians; the head nods back to keep the visor in view) */
const ENTRANCE_PITCH = 0.95;
/** His size once landed on the about section, as a scale multiplier (part 01b) */
export const LANDING_SIZE = 0.6;
/** How fast the landing catches up with the scroll: lower trails more (like the old site's `scrub: 3`) */
const LANDING_LAG = 3.5;
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
  /**
   * Element Nova lands on as the scroll-out runs (page mode, part 01b): he
   * frontflips to it instead of floating away, holds in the middle of the
   * screen until it arrives, then rides on it. Its parent is the block that
   * gets centered on screen when he lands.
   */
  landingSelector?: string;
  /** Shared with the space journey's cast (set by NovaStage) */
  journey?: RefObject<JourneyState>;
  /** Space Nova keeps clear at the top and bottom, in px (menu, logo band) */
  insetTop?: number;
  insetBottom?: number;
  /** Nova's height in px */
  height: number;
  /** Follow the pointer (off on touch screens) */
  follow?: boolean;
  /** Seconds after the page cover is gone before the entrance starts (negative: while it is still leaving) */
  enterDelay?: number;
  /** Horizontal band Nova keeps to, as fractions of the width (the banner keeps him right of the headline) */
  region?: [number, number];
  /** A label that follows Nova (the banner's "Nova / EVA-01" tag); shown once he has arrived */
  tag?: RefObject<HTMLElement | null>;
  /** Called once the model is loaded and prepared on the graphics card, before he shows */
  onLoaded?: () => void;
  /** Called once the first frame with Nova has been drawn */
  onShown?: () => void;
  /** Called if the scene cannot run (no WebGL 2 context, model failed to load, context lost) */
  onFail?: (reason: string) => void;
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
  /** Share of the way from the banner to the landing (part 01b), trailing the scroll */
  landing: number;
  /** Scroll distance from the banner's top, smoothed (the journey's lag) */
  scrolled: number;
  /** How far he has left the banner for the journey, 0 to 1 */
  enter: number;
  /** Back from the journey, he waits at his banner home until then */
  homeUntil: number;
  /** Phone tilt, smoothed, -1 to 1 (touch screens) */
  tiltX: number;
  tiltY: number;
  /** Where he was drawn last frame and how fast that moved, px and px per second */
  drawn: THREE.Vector2;
  drawnVelocity: THREE.Vector2;
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
  landingSelector,
  journey,
  insetTop = 0,
  insetBottom = 0,
  height,
  follow = true,
  enterDelay = 0,
  region = [0, 1],
  tag,
  onLoaded,
  onShown,
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

  const { model, bones, rest, handOffset, thumbOffset, beacon } = useMemo(() => {
    const model = cloneSkinned(scene);
    const bones = findBones(model);
    dressNova(model, suitEnvironment);
    return {
      model,
      bones,
      rest: captureRest(bones),
      handOffset: bones.handR.position.clone(),
      thumbOffset: bones.thumbR.position.clone(),
      beacon: createBeacon(model),
    };
  }, [scene, suitEnvironment]);

  // Prepare his materials on the graphics card while he is still hidden, so
  // the first frame that shows him is not a slow one.
  const camera = useThree((state) => state.camera);
  const stageScene = useThree((state) => state.scene);
  useEffect(() => {
    const group = root.current;
    if (!group) return;
    const wasVisible = group.visible;
    group.visible = true;
    gl.compile(stageScene, camera);
    group.visible = wasVisible;
    onLoaded?.();
    // Only once the model changes, not when the callback's identity does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, stageScene, camera, model]);

  // The entrance waits for the page cue (part 11): he can load and get ready
  // under the launch intro, and flies in as the orange leaves.
  const cue = useRef<number | null>(null);
  useEffect(() => {
    let live = true;
    whenPageReady().then(({ clearIn }) => {
      if (live) cue.current = clearIn;
    });
    return () => {
      live = false;
    };
  }, []);

  const tricks = useRef(emptyTrickState());
  // Our own handle on the tag element, so the frame loop can move it.
  const tagElement = useRef<HTMLElement | null>(null);
  useEffect(() => {
    tagElement.current = tag?.current ?? null;
  }, [tag]);
  // Links and buttons on screen, in canvas px, refreshed a few times a second.
  const obstacles = useRef({ rects: [] as DOMRect[], checkedAt: -1 });
  // Tricks run on their own clock, whether or not the pointer moves. `run`
  // tells an interrupted trick's completion apart from the current one's.
  const trickClock = useRef({ now: 0, nextAt: FIRST_TRICK, previous: null as TrickName | null, playing: false, run: 0 });
  const startedAt = useRef<number | null>(null);
  const clockTime = useRef(0);
  // The box mode (lab) has no cast; it keeps a journey state of its own.
  const ownJourney = useRef<JourneyState>(createJourneyState());
  const journeyState = journey ?? ownJourney;
  const journeyCue = useRef<NovaCue>({ fx: 0.5, fy: 0.5, z: 0, scale: 1, spin: 0, tuck: 0, kick: 0, wave: 0, lookX: null, lookY: null });
  // The entrance: a GSAP timeline drives his place on screen (px), his depth
  // (`zoom`, a scale multiplier: 0 is far away, above 1 is close to the
  // screen), how much of the flying pose he holds (`fly`), how far he is
  // tipped head first toward the viewer (`pitch`, radians) and whether he is
  // behind the text.
  const entrance = useRef({
    active: true,
    x: 0,
    y: 0,
    zoom: 0,
    fly: 1,
    pitch: 0,
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
    landing: 0,
    scrolled: 0,
    enter: 0,
    homeUntil: 0,
    tiltX: 0,
    tiltY: 0,
    drawn: new THREE.Vector2(),
    drawnVelocity: new THREE.Vector2(),
    entered: false,
  });

  useEffect(() => {
    trackPointer();
    if (mode === "page") trackTilt();
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
      if (entrance.current.active || motion.current.landing > 0.02) return;
      if (event.button !== 0 || (event.target as Element | null)?.closest?.(INTERACTIVE)) return;
      start(nextTrick(clock.previous));
    };
    window.addEventListener("nova:trick", onTrick);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("nova:trick", onTrick);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [mode]);

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
    };
    (window as unknown as { __nova?: typeof debug }).__nova = debug;
  }, [bones, rest]);

  useFrame((state, rawDelta) => {
    const group = root.current;
    if (!group) return;
    if ((window as unknown as { __nova?: { freeze: boolean } }).__nova?.freeze) return;
    const dt = Math.min(rawDelta, 1 / 30);
    // His own clock: the canvas clock restarts when rendering pauses (scrolled
    // off screen) and resumes, which would replay the entrance and hide him.
    clockTime.current += Math.min(rawDelta, 0.1);
    const time = clockTime.current;
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
      left: Math.max(novaW * 0.85, w * region[0]),
      right: Math.max(Math.max(novaW * 0.85, w * region[0]), Math.min(w - novaW * 0.85, w * region[1])),
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

    // Entrance: from far behind, top left, he flies head first toward the
    // viewer (pitched so his head leads, face tipped up), arms tight to his
    // body, down to the bottom middle, behind the text. There he levels out,
    // comes over everything and backflips up to the middle of the banner,
    // coming close to the screen on the way, then waves hello.
    // Tricks, following and wandering start once he is done.
    const e = entrance.current;
    if (startedAt.current === null && cue.current === null) {
      group.visible = false;
      return;
    }
    if (startedAt.current === null) {
      startedAt.current = time + Math.max(0, (cue.current ?? 0) + enterDelay);
      m.wander = Math.random() * 100;
      // From just outside the top-left corner (so he flies in across the
      // edge rather than appearing on screen), small and behind the text,
      // diagonally down to the bottom middle.
      const low = new THREE.Vector2(w * 0.5, h - insetBottom * 0.55);
      const start = new THREE.Vector2(-novaW * 0.35, -novaH * 0.2);
      // He lands in the middle of his band (the whole width unless a region is set).
      const middle = new THREE.Vector2((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
      const clock = trickClock.current;
      clock.playing = true;
      Object.assign(e, { x: start.x, y: start.y, zoom: 0, fly: 1, pitch: ENTRANCE_PITCH, behind: true });
      // Paused: the frame loop steps it by each frame's (capped) delta, so a
      // slow frame never skips it ahead and he can never pop in mid-growth.
      e.timeline = gsap
        .timeline({
          paused: true,
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
        // He emerges from a point in the corner (no pop), quickly reaches a small
        // but visible size, and crosses at an even pace so the diagonal reads,
        // growing steadily as he comes closer.
        .to(e, { x: low.x, y: low.y, duration: 2.1, ease: "sine.inOut" }, 0)
        .to(e, { zoom: 0.12, duration: 0.45, ease: "power2.out" }, 0)
        .to(e, { zoom: ENTRANCE_FLIGHT_SIZE, duration: 1.65, ease: "sine.in" }, 0.45)
        // Pull up: level out and come in front of everything.
        .set(e, { behind: false }, 1.95)
        .to(e, { pitch: 0, fly: 0, duration: 0.45, ease: "power2.inOut" }, 1.85)
        // Backflip up to the middle, close to the screen at the top of the arc.
        .to(e, { x: middle.x, duration: 1.5, ease: "power1.inOut" }, 2.1)
        .to(e, { y: middle.y, duration: 1.5, ease: "power2.out" }, 2.1)
        .to(e, { zoom: ENTRANCE_CLOSEST, duration: 0.75, ease: "sine.out" }, 2.1)
        .to(e, { zoom: 1, duration: 0.75, ease: "sine.inOut" }, 2.85)
        .to(s, { flip: -1, duration: 1.5, ease: "power2.inOut" }, 2.1)
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
    if (!group.visible) {
      group.visible = true;
      onShown?.();
    }
    if (e.active && e.timeline) e.timeline.time(e.timeline.time() + dt);

    // Pointer in canvas space.
    const px = pointer.x - rect.left;
    const py = pointer.y - rect.top;
    const pointerInside = px >= 0 && px <= w && py >= 0 && py <= h;
    // Watching: his head and body turn to the pointer. Following: he also moves
    // toward it, only while he floats around the banner.
    const watching = follow && m.entered && pointerIsActive(2500) && pointerInside;
    // His banner home: vertically centered, in the middle of his band (the right side).
    const homeX = (bounds.left + bounds.right) / 2;
    const homeY = clamp(h / 2, bounds.top, bounds.bottom);
    if (m.enter > 0.3) {
      // Away on the journey: his banner self waits at home, so scrolling back
      // brings him there, and he lingers a moment before wandering again.
      m.position.set(homeX, homeY);
      m.velocity.set(0, 0);
      m.homeUntil = time + 1.6;
    }
    const homing = time < m.homeUntil;
    // Phones: tilt plays the pointer's part. He floats toward the low side and
    // looks that way; on the journey it adds parallax.
    const tilting = !follow && tiltIsActive();
    m.tiltX = THREE.MathUtils.damp(m.tiltX, tilting ? phoneTilt.x : 0, 4, dt);
    m.tiltY = THREE.MathUtils.damp(m.tiltY, tilting ? phoneTilt.y : 0, 4, dt);
    const following = watching && m.landing < 0.1 && !homing;

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
    } else if (homing) {
      m.target.set(homeX, homeY);
    } else if (tilting) {
      // The whole band: phones leave him little room, so every bit counts.
      m.target.set(homeX + m.tiltX * Math.max((bounds.right - bounds.left) * 0.5, w * 0.22), homeY + m.tiltY * (bounds.bottom - bounds.top) * 0.5);
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
      const stiffness = following ? 6 : tilting ? 5 : 3;
      const damping = 2 * Math.sqrt(stiffness) * 0.9;
      m.velocity.x += (stiffness * (m.target.x - m.position.x) - damping * m.velocity.x) * dt;
      m.velocity.y += (stiffness * (m.target.y - m.position.y) - damping * m.velocity.y) * dt;
      m.position.x += m.velocity.x * dt;
      m.position.y += m.velocity.y * dt;
    }

    // Tricks every few seconds, while he follows the pointer or not.
    const clock = trickClock.current;
    clock.now = time;
    // Leaving the banner ends any trick: the landing flip takes over.
    if (m.landing > 0.02 && clock.playing && !e.active) {
      clock.run++;
      clock.playing = false;
      settleTricks(s, 0.3);
    }
    if (m.entered && m.landing <= 0.02 && !clock.playing && time > clock.nextAt) {
      const run = ++clock.run;
      clock.playing = true;
      clock.previous = nextTrick(clock.previous);
      playTrick(clock.previous, s).then(() => {
        if (run !== clock.run) return;
        clock.playing = false;
        clock.nextAt = clock.now + THREE.MathUtils.randFloat(...TRICK_GAP);
      });
    }

    // Scroll-out (page mode, no landing spot): float up and off as the banner leaves.
    const banner = mode === "page" && scrollOutSelector ? document.querySelector(scrollOutSelector) : null;
    const slot = mode === "page" && landingSelector ? document.querySelector(landingSelector) : null;
    if (banner && !slot) {
      const progress = clamp(-banner.getBoundingClientRect().top / banner.clientHeight, 0, 1);
      m.scroll = THREE.MathUtils.damp(m.scroll, progress, 10, dt);
    }

    // Journey and landing (part 01b). One smoothed scroll distance drives it
    // all, so it reverses when scrolling back up and trails a fast flick:
    // - the banner leaves and he lets go of the pointer, drifting to the
    //   middle-right (`enter`);
    // - the space journey plays (`j`, see space-journey.ts): rocket,
    //   asteroids, the planet he circles, the UFO;
    // - the last screen is the landing (`p`): to the landing spot with a
    //   frontflip, a soft touchdown, a hold in the middle of the screen until
    //   the spot arrives, then a ride off the top on it.
    let landX = 0;
    let landY = 0;
    let p = 0;
    let j = 0;
    let enter = 0;
    let slotY = h * 2;
    if (slot && banner) {
      const spot = slot.getBoundingClientRect();
      const block = (slot.parentElement ?? slot).getBoundingClientRect();
      // Where the spot sits when its block is centered on screen.
      const hold = Math.max(insetTop, (h - block.height) / 2) + (spot.top - block.top) + spot.height / 2;
      const spotY = spot.top - rect.top + spot.height / 2;
      slotY = spotY;
      landX = spot.left - rect.left + spot.width / 2;
      landY = Math.min(hold, spotY);
      const scrolled = Math.max(0, -banner.getBoundingClientRect().top);
      const total = scrolled + Math.max(0, spotY - hold);
      m.scrolled = THREE.MathUtils.damp(m.scrolled, scrolled, LANDING_LAG, dt);
      if (Math.abs(m.scrolled - scrolled) < 0.5) m.scrolled = scrolled;
      const landingFrom = Math.max(h * 0.6, total - h * 1.1);
      const journeyFrom = h * 0.45;
      enter = easeInOut(range(m.scrolled, 0, h * 0.6));
      j = landingFrom > journeyFrom ? range(m.scrolled, journeyFrom, landingFrom) : enter;
      p = range(m.scrolled, landingFrom, total);
      m.landing = total > 0 ? clamp(m.scrolled / total, 0, 1) : 0;
    }
    m.enter = enter;
    const travel = easeInOut(range(p, 0.05, 0.75));
    const landFlip = easeInOut(range(p, 0.15, 0.7));
    const landTuck = bump(range(p, 0.18, 0.66)) ** 1.5;
    const settled = range(p, 0.7, 1);
    // A soft knee bend as his feet meet the spot, springing back.
    const touchdown = bump(range(p, 0.82, 1));

    // Where the journey has him, in canvas px and depth.
    const aspect = w / h;
    const K = novaH * unit;
    const path = novaAt(j, aspect, K, journeyCue.current);
    // Full size on the journey, smaller while circling the planet, then the landing size.
    const size = THREE.MathUtils.lerp(1 + (path.scale - 1) * enter, LANDING_SIZE, travel);
    const journeyX = path.fx * w;
    const journeyY = path.fy * h;
    const shared = journeyState.current;
    Object.assign(shared, {
      j: j > 0 && enter > 0 ? j : 0,
      K,
      lite: w < 768,
      novaFy: path.fy,
      tiltX: m.tiltX,
      tiltY: m.tiltY,
      novaFeetFy: path.fy + (novaH * path.scale * 0.5) / h,
      p,
      spotFx: landX / w,
      spotFy: slotY / h,
    });

    // Zero-g float on top of everything, at every stage.
    const bobX = wobble(time * 0.55, 21) * novaH * 0.04 * size;
    const bobY = wobble(time * 0.8, 22) * novaH * 0.06 * size;
    const bannerX = m.position.x;
    const bannerY = m.position.y - s.lift * novaH;
    const baseX = THREE.MathUtils.lerp(THREE.MathUtils.lerp(bannerX, journeyX, enter), landX, travel);
    const baseY = THREE.MathUtils.lerp(THREE.MathUtils.lerp(bannerY, journeyY, enter), landY, travel);
    const drawZ = path.z * enter * (1 - travel);
    // Tilt nudges him on the journey too, a little less than the scene around him.
    const drawX = baseX + bobX + m.tiltX * novaH * 0.18 * enter * (1 - travel);
    const lifted = baseY + bobY + m.tiltY * novaH * 0.12 * enter * (1 - travel);
    const drawY = lifted - m.scroll * (lifted + novaH * 1.2);

    // His attitude follows how he actually moves on screen, so the journey
    // and the ride off the top drag his limbs like any other move.
    if (m.drawn.lengthSq()) {
      m.drawnVelocity.x = THREE.MathUtils.damp(m.drawnVelocity.x, (drawX - m.drawn.x) / dt, 10, dt);
      m.drawnVelocity.y = THREE.MathUtils.damp(m.drawnVelocity.y, (drawY - m.drawn.y) / dt, 10, dt);
    }
    m.drawn.set(drawX, drawY);
    const vx = THREE.MathUtils.lerp(m.velocity.x, m.drawnVelocity.x, enter);
    const vy = THREE.MathUtils.lerp(m.velocity.y, m.drawnVelocity.y, enter);

    // Body attitude from velocity (px per second), smoothed.
    // Acceleration drives follow-through: limbs swing against sudden changes.
    m.acceleration.x = THREE.MathUtils.damp(m.acceleration.x, (vx - m.previousVelocity.x) / dt, 8, dt);
    m.acceleration.y = THREE.MathUtils.damp(m.acceleration.y, (vy - m.previousVelocity.y) / dt, 8, dt);
    m.previousVelocity.set(vx, vy);
    // During the entrance the timeline sets his heading, so no banking from speed.
    const steer = e.active ? 0 : 1;
    // Phones: he also leans into the tilt, like a passenger.
    m.bank = THREE.MathUtils.damp(m.bank, clamp(-vx * 0.0011 - m.tiltX * 0.35, -0.55, 0.55) * steer, 6, dt);
    m.pitch = THREE.MathUtils.damp(m.pitch, clamp(vy * 0.0007, -0.4, 0.4) * steer, 6, dt);
    // On the journey he looks at what is happening around him; otherwise the
    // pointer when it moves, or ahead of himself.
    const sceneLook = path.lookX !== null && path.lookY !== null && enter > 0.5 && travel < 0.5;
    const tiltLook = !sceneLook && !watching && Math.abs(m.tiltX) + Math.abs(m.tiltY) > 0.04;
    const lookAtX = sceneLook ? path.lookX! * w : tiltLook ? drawX + m.tiltX * w * 0.6 : px;
    const lookAtY = sceneLook ? path.lookY! * h : tiltLook ? drawY + m.tiltY * h * 0.6 : py;
    const looking = sceneLook || watching || tiltLook;
    const yawGoal = looking ? clamp(((lookAtX - drawX) / w) * 1.6, -0.6, 0.6) : clamp(vx * 0.0012, -0.5, 0.5);
    // Landed, he turns mostly his head, not his whole body.
    m.yaw = THREE.MathUtils.damp(m.yaw, yawGoal * (1 - settled * 0.6), 3, dt);
    m.tumble = THREE.MathUtils.damp(m.tumble, 0, 1.4, dt);

    const lookGoalX = looking ? (lookAtX - drawX) / w : clamp(vx * 0.002, -0.3, 0.3);
    const lookGoalY = looking ? (lookAtY - drawY) / h : 0;
    m.lookX = THREE.MathUtils.damp(m.lookX, clamp(lookGoalX * 2, -1, 1), 5, dt);
    m.lookY = THREE.MathUtils.damp(m.lookY, clamp(lookGoalY * 2, -1, 1), 5, dt);

    toWorld(drawX / w, drawY / h, drawZ, aspect, group.position);
    shared.nova.copy(group.position);

    // The tag rides beside his shoulder, once he has arrived and until he leaves.
    const label = tagElement.current;
    if (label) {
      // Beside his right shoulder, or his left one when the right edge is too close.
      const right = drawX + novaW * 0.42;
      const x = right + label.offsetWidth + 12 <= w ? right : drawX - novaW * 0.42 - label.offsetWidth;
      label.style.transform = `translate3d(${x}px, ${drawY - novaH * 0.32}px, 0)`;
      const shown = !e.active && m.scroll < 0.12 && enter < 0.03 ? "1" : "0";
      if (label.dataset.shown !== shown) label.dataset.shown = shown;
    }
    group.userData.baseScale = (novaH * unit) / MODEL_HEIGHT;
    // Depth: the entrance zoom, and a slight drift toward and away from the screen.
    const depth = e.active ? e.zoom : 1 + wobble(time * 0.3, 24) * 0.04;
    group.scale.setScalar(group.userData.baseScale * depth * size);
    // Whole-body drift: slow, never-repeating roll, pitch and turn on top of the motion.
    // Kept low during the entrance so he faces the user as he arrives and waves,
    // and a little lower once landed so he reads as standing, still afloat.
    const drift = (e.active ? 0.25 : following ? 0.5 : 1) * (1 - settled * 0.35);
    // A slow sweep turns him far enough to show his side now and then.
    const turn = wobble(time * 0.4, 2) * 0.3 + wobble(time * 0.13, 23) * 0.75;
    const journeyOn = enter * (1 - travel);
    group.rotation.set(
      m.pitch + (e.active ? e.pitch : 0) + (s.flip + landFlip) * TURN + wobble(time * 0.5, 1) * 0.15 * drift,
      m.yaw + (s.spin + path.spin * journeyOn) * TURN + turn * drift * (1 - settled * 0.5),
      m.bank + m.tumble + s.roll * TURN + wobble(time * 0.6, 3) * 0.2 * drift + m.scroll * 0.5,
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
    // Landed, the swim kick calms down but never stops: he is still afloat.
    const idle = (following ? 0.6 : 1) * (1 - fly) * (1 - settled * 0.45);
    const breath = Math.sin(time * 1.5);
    const journeyOnPose = enter * (1 - travel);
    const tuck = Math.max(s.tuck, landTuck, path.tuck * journeyOnPose);
    const kickOff = path.kick * journeyOnPose;
    // Waving: his own wave trick, or waving back at the alien.
    const waving = Math.max(s.wave, path.wave * journeyOnPose);
    const armRaise = Math.max(s.armR, path.wave * journeyOnPose);
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
    const nod = spring("nod", m.lookY * 0.2 - breath * 0.02 + wobble(time * 0.5, 6) * 0.07 - whipY * 0.1 - fly * 0.5, 14, 0.5);
    const tilt = spring("tilt", -look * 0.15 + wobble(time * 0.45, 16) * 0.05 - whipX * 0.1, 12, 0.45);
    poseBone(b.spine2, rest, group, [[AXIS.y, look * 0.9], [AXIS.x, nod * 0.85], [AXIS.z, tilt * 0.85]]);
    poseBone(b.spine3, rest, group, [[AXIS.y, look * 0.1], [AXIS.x, nod * 0.15], [AXIS.z, tilt * 0.15]]);

    // Arms: a lazy alternating stroke plus drift, dragged by the motion.
    // Raises stop near horizontal: higher, the shoulders fold into the body.
    const raise = (amount: number) => clamp(amount, -0.38, 1.45);
    const stroke = Math.sin(time * 1.2);
    // The wave, like a person's: upper arm out, elbow bent so the forearm
    // stands up clear of the helmet, the forearm swinging side to side from
    // the elbow with a little sway from the shoulder, palm forward and
    // fingers open, the hand trailing the forearm. Elbows otherwise stay
    // nearly straight; only the wave bends one.
    const swing = Math.sin(time * WAVE_SPEED);
    const trail = Math.sin(time * WAVE_SPEED - 0.7);
    // Biased outward: the forearm swings between upright and leaning out,
    // never across the helmet.
    const wave = waving * swing * 0.28;
    const armLz = spring("armLz", raise(0.22 + wobble(time * 0.8, 7) * 0.2 * idle + dragY * 0.6 + whipY * 0.5 + s.armL * 1.3 + touchdown * 0.35 - tuck * 0.1 - fly * 0.6) + dragX * (1 - fly) + whipX * (1 - fly), 22, 0.35);
    const armRz = spring("armRz", -raise(0.22 + wobble(time * 0.8, 8) * 0.2 * idle + dragY * 0.6 + whipY * 0.5 + armRaise * 1.3 + touchdown * 0.35 - waving * 0.15 - tuck * 0.1 - fly * 0.6) - waving * swing * 0.06 + dragX * (1 - fly) + whipX * (1 - fly), 22, 0.35);
    const armLx = spring("armLx", stroke * 0.2 * idle + wobble(time * 0.7, 9) * 0.1 - tuck * 0.25, 20, 0.4);
    const armRx = spring("armRx", -stroke * 0.2 * idle + wobble(time * 0.7, 10) * 0.1 - tuck * 0.25, 20, 0.4);
    poseBone(b.armL1, rest, group, [[AXIS.z, armLz - ARM_REST_LIFT], [AXIS.x, armLx]]);
    poseBone(b.armR1, rest, group, [[AXIS.z, armRz + ARM_REST_LIFT], [AXIS.x, armRx]]);
    // Elbows stay nearly straight: he reads as a soft toy, not a jointed figure.
    const elbowL = spring("elbowL", 0.1 + wobble(time, 11) * 0.06 * idle + tuck * 0.15 + Math.max(0, stroke) * 0.04 * idle - fly * 0.1, 30, 0.35);
    const elbowR = spring("elbowR", 0.1 + wobble(time, 12) * 0.06 * idle + tuck * 0.15 + Math.max(0, -stroke) * 0.04 * idle + waving * 0.62 - fly * 0.1, 30, 0.35);
    poseBone(b.armL2, rest, group, [[AXIS.z, elbowL]]);
    poseBone(b.armR2, rest, group, [[AXIS.z, -(elbowR + wave)]]);
    poseBone(b.handL, rest, group, [[AXIS.z, spring("handL", wobble(time * 1.2, 13) * 0.35 + whipX * 0.4, 40, 0.3)]]);
    poseBone(b.handR, rest, group, [
      [AXIS.y, waving * 1.2],
      [AXIS.z, spring("handR", wobble(time * 1.2, 14) * 0.35 * (1 - waving) + whipX * 0.4 - waving * trail * 0.25, 40, 0.3)],
    ]);
    poseBone(b.fingersR, rest, group, [[AXIS.x, -waving * 1.0]]);
    // Turning the palm forward swings the thumb root into the cuff: the hand
    // slides a little out of the sleeve, and the thumb moves up the hand,
    // clear of the cuff, and angles outward.
    // Full strength early (the palm turns as the wave starts), so the thumb
    // is already clear while the wave eases in and out.
    const clear = Math.min(1, waving * 3);
    b.handR.position.copy(handOffset).multiplyScalar(1 + clear * WAVE_HAND_REACH);
    b.thumbR.position.copy(thumbOffset).addScaledVector(b.fingersR.position, clear * WAVE_THUMB_LIFT);
    poseBone(b.thumbR, rest, group, [[AXIS.y, clear * 0.55]]);

    // Legs: an alternating swim kick with knees, drifting apart, trailing the
    // motion; tucked in during flips.
    const kick = Math.sin(time * 1.6);
    const spread = 0.1 + wobble(time * 0.6, 15) * 0.08;
    // Touching down, the hips fold a little forward as the knees bend.
    const legL = spring("legL", -kick * 0.36 * idle - tuck * 0.95 - touchdown * 0.22 + kickOff * 0.35 - (dragY * 0.25 + whipY * 0.3) * (1 - fly) + fly * 0.2, 20, 0.4);
    const legR = spring("legR", kick * 0.36 * idle - tuck * 0.95 - touchdown * 0.22 + kickOff * 0.35 - (dragY * 0.25 + whipY * 0.3) * (1 - fly) + fly * 0.2, 20, 0.4);
    const together = spread * (1 - fly) * (1 - settled * 0.4) - fly * 0.04;
    const legLz = spring("legLz", together + (dragX * 0.9 + whipX * 0.6) * (1 - fly), 18, 0.4);
    const legRz = spring("legRz", -together + (dragX * 0.9 + whipX * 0.6) * (1 - fly), 18, 0.4);
    poseBone(b.legL, rest, group, [[AXIS.x, legL], [AXIS.z, legLz]]);
    poseBone(b.legR, rest, group, [[AXIS.x, legR], [AXIS.z, legRz]]);
    poseBone(b.legL2, rest, group, [[AXIS.x, spring("kneeL", 0.15 + Math.max(0, kick) * 0.45 * idle + tuck * 1.2 + touchdown * 0.5 + fly * 0.05, 26, 0.4)]]);
    poseBone(b.legR2, rest, group, [[AXIS.x, spring("kneeR", 0.15 + Math.max(0, -kick) * 0.45 * idle + tuck * 1.2 + touchdown * 0.5 + fly * 0.05, 26, 0.4)]]);

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
class NovaBoundary extends Component<{ children: ReactNode; onFail?: (reason: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[nova] scene failed, showing the still image instead:", error);
    this.props.onFail?.(error instanceof Error ? error.message : String(error));
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The 3D canvas with Nova. Loaded lazily by NovaLayer; never server-rendered. */
export default function NovaStage(props: NovaStageProps) {
  const { mode = "page", scrollOutSelector, landingSelector } = props;
  const [active, setActive] = useState(true);
  const journey = useRef<JourneyState>(createJourneyState());

  // Stop rendering once the banner has scrolled away (page mode).
  useEffect(() => {
    if (mode !== "page" || !scrollOutSelector) return;
    const update = () => {
      // With a landing spot he rides it off the top; otherwise he leaves with the banner.
      const until = (landingSelector && document.querySelector(landingSelector)) || document.querySelector(scrollOutSelector);
      if (!until) return;
      // Keep rendering a little past it so a fast scroll never freezes him
      // half visible; by then he is fully off screen.
      setActive(until.getBoundingClientRect().bottom > -window.innerHeight * 0.6);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [mode, scrollOutSelector, landingSelector]);

  return (
    <NovaBoundary onFail={props.onFail}>
    <Canvas
      onCreated={({ gl }) => {
        // A lost context (driver reset, GPU blocklisted mid-session) also falls back.
        gl.domElement.addEventListener("webglcontextlost", () => props.onFail?.("WebGL context lost"), { once: true });
      }}
      style={
        mode === "page"
          ? { position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }
          : { position: "absolute", inset: 0, pointerEvents: "none" }
      }
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.05 }}
      camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_Z], near: 0.1, far: 50 }}
      aria-hidden
    >
      <Studio />
      <NovaBoundary onFail={props.onFail}>
        <Suspense fallback={null}>
          <Nova {...props} journey={journey} />
          {mode === "page" && landingSelector && <SpaceCast journey={journey} />}
        </Suspense>
      </NovaBoundary>
    </Canvas>
    </NovaBoundary>
  );
}

useLoader.preload(GLTFLoader, MODEL_URL, withMeshopt);
