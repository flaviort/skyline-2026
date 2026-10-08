"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Nova adrift: tumbles slowly in place, bobs, and drifts away from the
 * pointer as if it pushed him. Still with reduced motion.
 */
export function LostNova() {
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(body.current, { rotate: 360, duration: 40, ease: "none", repeat: -1 });
        gsap.to(root.current, { y: "-3rem", duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
        const x = gsap.quickTo(body.current, "x", { duration: 2.4, ease: "power3" });
        const y = gsap.quickTo(body.current, "y", { duration: 2.4, ease: "power3" });
        const push = (event: PointerEvent) => {
          x(((window.innerWidth / 2 - event.clientX) / window.innerWidth) * 120);
          y(((window.innerHeight / 2 - event.clientY) / window.innerHeight) * 120);
        };
        window.addEventListener("pointermove", push, { passive: true });
        return () => window.removeEventListener("pointermove", push);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className="pointer-events-none">
      <div ref={body}>
        <Image src="/images/legacy/nova.png" alt="" width={932} height={1289} preload className="h-[44svh] w-auto max-md:h-[30svh]" />
      </div>
    </div>
  );
}
