"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { launchIntro } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { finishIntro, introHolds } from "@/lib/intro";
import { signalPageReady } from "@/lib/page-ready";

/** The count never holds the orange screen past this, in ms after navigation */
const DEADLINE = 5000;
/** Shortest time between two stage lights, in ms, so a fast load still reads as a countdown */
const MIN_GAP = 350;
/** After the deadline the remaining lights play at this pace, in ms */
const LATE_GAP = 120;
/** How long "T-minus 01" holds before "Liftoff", in ms (user, 2026-10-05) */
const ONE_HOLD = 600;
/** How long "Liftoff" holds before the sweep, in ms */
const LIFTOFF_HOLD = 300;
/** The sweep that takes the orange off the screen, in seconds */
const SWEEP = 0.75;
const LIGHTS = 4;
/** How long a stage light takes to flip or roll into place, in seconds */
const ROLL = 0.32;

const pad = (n: number) => String(n).padStart(2, "0");
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/**
 * What each stage light waits for: fonts, the window load (images and
 * styles), whatever the page holds the intro for (Nova's model), and a
 * painted frame of the hydrated page.
 */
const MILESTONES: Array<() => Promise<unknown>> = [
  () => document.fonts?.ready ?? Promise.resolve(),
  () =>
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener("load", resolve, { once: true })),
  () => frame().then(introHolds),
  frame,
];

/**
 * Clip path for the sweep: one straight edge pivoting on the bottom-left
 * corner. At 90 degrees it is upright on the left edge (all orange); its far
 * end slides along the top edge, then down the right edge, to 0 (all gone).
 */
function sweepPath(degrees: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const tan = Math.tan((degrees * Math.PI) / 180);
  if (degrees >= 90) return "none";
  const x = tan > 0 ? h / tan : Infinity;
  if (x <= w) return `polygon(0px ${h}px, ${x}px 0px, ${w}px 0px, ${w}px ${h}px)`;
  return `polygon(0px ${h}px, ${w}px ${Math.max(0, h - w * tan)}px, ${w}px ${h}px)`;
}

type LaunchIntroProps = {
  /** Lab only: plays on its own with fake milestones and leaves the page alone */
  preview?: { slow?: boolean; onDone?: () => void };
};

/**
 * The launch intro on every full page load (part 11a). An orange screen from
 * the first paint (server-rendered, shown by the `intro` class the inline
 * script sets), a countdown of four stage lights that each wait for a real
 * loading milestone, "Liftoff", then a sweep that cuts the orange away and
 * cues the page entrance. Scroll is locked until the sweep. Not shown with
 * reduced motion or without JavaScript.
 */
export function LaunchIntro({ preview }: LaunchIntroProps) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  const locked = useRef(!preview);

  // Lenis may arrive after the intro starts; keep it stopped until the sweep.
  useEffect(() => {
    lenisRef.current = lenis;
    if (locked.current) lenis?.stop();
  }, [lenis]);

  useGSAP(
    () => {
      const box = root.current;
      if (!box) return;
      const unlock = () => {
        if (preview) return;
        locked.current = false;
        document.documentElement.classList.remove("intro-lock");
        lenisRef.current?.start();
      };
      const shown = getComputedStyle(box).display !== "none";
      if (!preview && !shown) {
        // Reduced motion: no cover, the page shows right away.
        unlock();
        finishIntro();
        signalPageReady({ clearIn: 0 });
        setGone(true);
        return;
      }

      let alive = true;
      const q = gsap.utils.selector(box);
      const lights = q<HTMLElement>("[data-light]");
      const count = box.querySelector<HTMLElement>("[data-count]");
      const fake = (ms: number) => () => wait(ms);
      const steps = preview ? MILESTONES.map(() => fake(preview.slow ? 1800 : 150)) : MILESTONES;
      const deadline = (preview ? performance.now() : 0) + DEADLINE;

      const run = async () => {
        // The label types in, like the reference's "Loading".
        const typing = gsap.timeline();
        q("[data-type]").forEach((char, index) => typing.set(char, { visibility: "visible" }, index * 0.045));
        await typing;

        let last = performance.now();
        for (let i = 0; i < LIGHTS; i++) {
          const late = performance.now() >= deadline;
          if (!late) await Promise.race([steps[i](), wait(deadline - performance.now())]);
          if (!alive) return;
          await wait((late ? LATE_GAP : MIN_GAP) - (performance.now() - last));
          if (!alive) return;
          last = performance.now();
          // Each light lands with its own number (04 with the first, 01 with
          // the last), both finishing on the same frame.
          const tick = gsap.timeline();
          if (i === 0) {
            // The first light flips open from a thin edge, turning in 3D on its left side.
            tick.fromTo(
              lights[0],
              { autoAlpha: 1, rotationY: -90, transformPerspective: 40, transformOrigin: "0% 50%" },
              { rotationY: 0, duration: ROLL, ease: "power2.out" },
            );
          } else {
            // The others roll out of the light before them: each starts on top
            // of it and tips over its bottom-right corner into the next slot,
            // like a die rolled to the right.
            const step = lights[i].offsetLeft - lights[i - 1].offsetLeft;
            const size = lights[i].offsetWidth;
            tick.fromTo(
              lights[i],
              { autoAlpha: 1, rotate: -90, x: size - step, transformOrigin: "0% 100%" },
              { rotate: 0, x: 0, duration: ROLL, ease: "power2.inOut" },
            );
          }
          const numberIn = 0.18;
          if (count?.textContent) tick.to(count, { yPercent: -110, duration: 0.08, ease: "power2.in" }, ROLL - numberIn - 0.08);
          tick
            .add(() => void (count && (count.textContent = pad(launchIntro.from - i))), ROLL - numberIn)
            .fromTo(count, { yPercent: 110 }, { yPercent: 0, duration: numberIn, ease: "power3.out" }, ROLL - numberIn);
        }

        // Liftoff: "T-minus 01" holds once it has landed, then the countdown
        // line leaves and the word takes its place.
        await wait(ROLL * 1000 + ONE_HOLD);
        if (!alive) return;
        await gsap
          .timeline()
          .to(q("[data-row='count']"), { yPercent: -110, duration: 0.18, ease: "power2.in" })
          .fromTo(
            q("[data-row='liftoff']"),
            { yPercent: 110, autoAlpha: 1 },
            { yPercent: 0, duration: 0.22, ease: "power2.out" },
          );
        await wait(LIFTOFF_HOLD);
        if (!alive) return;
        // The lights go out left to right, each with a small bounce: a quick
        // swell, then shrinking away with a twist, the stamp-in played backwards.
        gsap.set(lights, { transformOrigin: "50% 50%" });
        await gsap.to(lights, {
          keyframes: [
            { scale: 1.15, duration: 0.1, ease: "power2.out" },
            { scale: 0, rotate: 30, duration: 0.25, ease: "back.in(3)" },
          ],
          stagger: 0.07,
        });
        if (!alive) return;
        await gsap.to(q("[data-loader]"), { autoAlpha: 0, duration: 0.15, ease: "power1.out" });
        if (!alive) return;

        // The sweep: the cue goes out as it starts, so the page builds while the orange leaves.
        if (!preview) {
          finishIntro();
          unlock();
          signalPageReady({ clearIn: SWEEP });
        }
        const sweep = { angle: 90 };
        await gsap.to(sweep, {
          angle: 0,
          duration: SWEEP,
          ease: "power2.inOut",
          onUpdate: () => void (box.style.clipPath = sweepPath(sweep.angle)),
        });
        if (!alive) return;
        if (preview) preview.onDone?.();
        else setGone(true);
      };
      run();

      return () => {
        alive = false;
      };
    },
    { scope: root, dependencies: [] },
  );

  if (gone) return null;

  return (
    <div ref={root} aria-hidden data-preview={preview ? "" : undefined} className="launch-intro">
      <div data-loader className="launch-intro__loader">
        <div className="launch-intro__lights">
          {Array.from({ length: LIGHTS }, (_, index) => (
            <span key={index} data-light className="launch-intro__light" />
          ))}
        </div>
        <p className="launch-intro__label">
          <span data-row="count" className="block">
            {Array.from(`${launchIntro.label} `, (char, index) => (
              <span key={index} data-type>
                {char}
              </span>
            ))}
            <span data-type className="launch-intro__mask">
              {/* A fixed slot: the invisible "00" holds the width, so the
                  centered loader never shifts as numbers come and go (the
                  slot is empty until the first light lands with "04"). */}
              <span className="invisible">00</span>
              <span data-count className="absolute inset-y-0 left-0" />
            </span>
          </span>
          <span data-row="liftoff" className="launch-intro__liftoff">
            {launchIntro.liftoff}
          </span>
        </p>
      </div>
    </div>
  );
}
