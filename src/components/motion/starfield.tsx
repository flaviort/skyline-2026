"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePageEntrance } from "./use-page-entrance";

type StarfieldProps = {
  className?: string;
};

// The old site's cloud (../skyline-2023/assets/js/functions.js): 1,000 stars
// (500 on phones) scattered in a shell 90 to 1,090 units around the camera,
// turning slowly around the horizontal axis, and pushed up 500 units over
// three screen heights of scroll with a 3 second lag (`scrub: 3`). Same
// numbers here, drawn as dots on one 2D canvas instead of 1,000 meshes.
const COUNT = { wide: 1000, narrow: 500 };
const SHELL = { inner: 90, depth: 1000 };
/** Radians per second: the old 0.0015 per frame at 60fps */
const SPIN = 0.09;
const SCROLL_LIFT = 500;
/** Higher catches up faster; 1.2 is close to the old scrub of 3 seconds */
const SCROLL_DAMPING = 1.2;
/** Old star size: a 0.5 unit tetrahedron (0.75 on phones) */
const STAR_SIZE = { wide: 0.5, narrow: 0.75 };
const FOV = (75 * Math.PI) / 180;

type Star = { x: number; y: number; z: number; glow: number };

function makeStars(count: number, depth: number): Star[] {
  return Array.from({ length: count }, () => {
    // A random direction, pushed out to a random distance in the shell.
    let x = Math.random() - 0.5;
    let y = Math.random() - 0.5;
    let z = Math.random() - 0.5;
    const length = Math.hypot(x, y, z) || 1;
    const distance = SHELL.inner + Math.random() * depth;
    x = (x / length) * distance;
    y = (y / length) * distance;
    z = (z / length) * distance;
    return { x, y, z, glow: 0.55 + Math.random() * 0.45 };
  });
}

/**
 * Scroll-reactive starfield, fixed behind every page (root layout). Drifts on
 * its own; scrolling pushes the stars up with a soft lag, so the faster the
 * scroll the faster they move, and they ease to a stop. Dark sections are
 * transparent so it shows through; light sections cover it. Pauses in
 * background tabs; one still frame with reduced motion. Fades in with the
 * first page entrance (it lives in the root layout, so only after the intro).
 */
export function Starfield({ className }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  usePageEntrance(
    (timeline) => {
      if (canvasRef.current) timeline.fromTo(canvasRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: "power1.out" });
    },
    { offset: -0.5 },
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const narrow = window.innerWidth < 768;
    const stars = makeStars(narrow ? COUNT.narrow : COUNT.wide, narrow ? 500 : SHELL.depth);
    const size = narrow ? STAR_SIZE.narrow : STAR_SIZE.wide;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let focal = 1;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      focal = height / 2 / Math.tan(FOV / 2);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let angle = 0;
    let lift = 0;
    let previous = performance.now();

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const cx = width / 2;
      const cy = height / 2;
      context.fillStyle = "#f8f8f8";
      const span = (SHELL.inner + SHELL.depth) * 2;
      for (const star of stars) {
        // Turn around the horizontal axis, then lift with the scroll. The lift
        // wraps around the shell, so the cloud never runs out on long pages.
        const turned = star.y * cos - star.z * sin + lift;
        const y = ((((turned + span / 2) % span) + span) % span) - span / 2;
        const z = star.y * sin + star.z * cos;
        if (z >= -1) continue; // behind the camera (it looks down -z)
        const depth = -z;
        const sx = cx + (star.x / depth) * focal;
        const sy = cy - (y / depth) * focal;
        if (sx < -4 || sx > width + 4 || sy < -4 || sy > height + 4) continue;
        const radius = (size / depth) * focal;
        context.globalAlpha = Math.min(1, star.glow * (0.35 + radius));
        if (radius < 0.9) context.fillRect(sx, sy, 1, 1);
        else {
          context.beginPath();
          context.arc(sx, sy, Math.min(radius, 2.2), 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
    };

    let frame = 0;
    let running = false;
    const tick = (time: number) => {
      const dt = Math.min((time - previous) / 1000, 1 / 20);
      previous = time;
      angle += SPIN * dt;
      // The old site stopped after three screens; here it keeps going down the whole page.
      const target = (window.scrollY / (window.innerHeight * 3)) * SCROLL_LIFT;
      lift += (target - lift) * (1 - Math.exp(-SCROLL_DAMPING * dt));
      draw();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || still) return;
      running = true;
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    draw();
    start();
    const onTab = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onTab);

    return () => {
      stop();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onTab);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none block size-full", className)} />;
}
