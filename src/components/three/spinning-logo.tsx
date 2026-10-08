"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo-mark";
import type { LogoFinish, SpinState } from "./spinning-logo-scene";

const Scene = dynamic(() => import("./spinning-logo-scene"), { ssr: false });

let webgl: boolean | null = null;
function hasWebGL() {
  if (webgl === null) {
    try {
      webgl = !!document.createElement("canvas").getContext("webgl2");
    } catch {
      webgl = false;
    }
  }
  return webgl;
}
const noSubscribe = () => () => {};

type SpinningLogoProps = {
  finish?: LogoFinish;
  /** Resting spin in radians per second */
  speed?: number;
  /** How much scroll speed adds to the spin */
  scrollBoost?: number;
  className?: string;
};

/**
 * The S mark in 3D, spinning on its own, faster while the page scrolls, and
 * throwable by dragging. Renders only while on screen. With reduced motion or
 * without WebGL it is the flat mark.
 */
export function SpinningLogo({ finish = "orange", speed = 0.6, scrollBoost = 1, className }: SpinningLogoProps) {
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  // three.js (about 240 KB) is fetched only once the mark comes near the screen.
  const [near, setNear] = useState(false);
  const supported = useSyncExternalStore(noSubscribe, hasWebGL, () => true);
  const spin = useRef<SpinState>({ boost: 0, pointer: { x: 0, y: 0 }, drag: { active: false, velocity: 0, delta: 0 } });
  const last = useRef({ x: 0, t: 0 });

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "60% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Scroll speed spins it up.
  useEffect(() => {
    if (!visible || reducedMotion) return;
    const trigger = ScrollTrigger.create({
      onUpdate: (self) => {
        const kick = (self.getVelocity() / 1000) * scrollBoost;
        if (Math.abs(kick) > Math.abs(spin.current.boost)) spin.current.boost = kick;
      },
    });
    const move = (event: globalThis.PointerEvent) => {
      const box = root.current?.getBoundingClientRect();
      if (!box) return;
      spin.current.pointer.x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
      spin.current.pointer.y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      trigger.kill();
      window.removeEventListener("pointermove", move);
    };
  }, [visible, reducedMotion, scrollBoost]);

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    spin.current.drag.active = true;
    spin.current.drag.velocity = 0;
    last.current = { x: event.clientX, t: performance.now() };
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const { drag } = spin.current;
    if (!drag.active) return;
    const now = performance.now();
    const dx = event.clientX - last.current.x;
    const turn = (dx / (root.current?.offsetWidth || 400)) * Math.PI * 1.6;
    drag.delta += turn;
    drag.velocity = turn / Math.max(0.008, (now - last.current.t) / 1000);
    last.current = { x: event.clientX, t: now };
  };
  const onUp = () => {
    const { drag } = spin.current;
    drag.active = false;
    drag.velocity = Math.max(-30, Math.min(30, drag.velocity));
  };

  const live = supported && !reducedMotion;

  return (
    <div
      ref={root}
      aria-hidden
      onPointerDown={live ? onDown : undefined}
      onPointerMove={live ? onMove : undefined}
      onPointerUp={live ? onUp : undefined}
      onPointerCancel={live ? onUp : undefined}
      className={cn("relative touch-pan-y select-none", live && "cursor-grab active:cursor-grabbing", className)}
    >
      {live ? (
        near ? <Scene finish={finish} spinRef={spin} active={visible} speed={speed} /> : null
      ) : (
        <LogoMark className={cn("absolute inset-[15%] h-[70%] w-[70%]", finish === "orange" ? "text-orange" : "text-ground")} />
      )}
    </div>
  );
}
