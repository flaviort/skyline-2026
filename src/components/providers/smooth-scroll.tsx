"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

// Lenis settings measured on the reference site.
const LENIS_OPTIONS = {
  lerp: 0.165,
  wheelMultiplier: 1.25,
  autoRaf: false,
} as const;

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Drive Lenis from the GSAP ticker so ScrollTrigger and smooth scroll share one clock.
  useEffect(() => {
    if (reducedMotion) return;

    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    const lenis = lenisRef.current?.lenis;
    lenis?.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis?.off("scroll", ScrollTrigger.update);
    };
  }, [reducedMotion]);

  if (reducedMotion) return <>{children}</>;

  return (
    <ReactLenis root options={LENIS_OPTIONS} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
