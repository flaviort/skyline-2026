"use client";

import { useId, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

type BadgeProps = {
  text: string;
  /** Seconds per turn at rest */
  duration?: number;
  className?: string;
};

/**
 * Round sticker with text running around its edge and the S mark in the
 * middle. Turns slowly, faster while the page scrolls, backward when
 * scrolling up.
 */
export function Badge({ text, duration = 16, className }: BadgeProps) {
  const root = useRef<HTMLDivElement>(null);
  const wheel = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const turn = gsap.to(wheel.current, { rotate: 360, duration, ease: "none", repeat: -1 });
        const trigger = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const velocity = self.getVelocity();
            const speed = (velocity < 0 ? -1 : 1) * (1 + Math.min(8, Math.abs(velocity) / 300));
            gsap.to(turn, { timeScale: speed, duration: 0.2, overwrite: true });
            gsap.to(turn, { timeScale: velocity < 0 ? -1 : 1, duration: 1.4, delay: 0.2, ease: "power2.out" });
          },
        });
        return () => {
          trigger.kill();
          turn.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Short texts go round twice; the spacing stretches to close the circle exactly.
  const run = text.length < 22 ? `${text} · ${text} · ` : `${text} · `;
  // Uppercase bold runs about 0.8em per character; size the type so the run fits the ring.
  const ring = 2 * Math.PI * 78;
  const fontSize = Math.min(16, ring / (run.length * 0.8));

  return (
    <div ref={root} role="img" aria-label={text} className={cn("relative grid aspect-square place-items-center rounded-full bg-orange text-ink", className)}>
      <svg ref={wheel} viewBox="0 0 200 200" aria-hidden className="absolute inset-0 h-full w-full">
        <defs>
          <path id={`badge-${id}`} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text className="fill-current font-bold uppercase" style={{ fontSize }}>
          <textPath href={`#badge-${id}`} textLength={ring - 4} lengthAdjust="spacing">
            {run}
          </textPath>
        </text>
      </svg>
      <LogoMark className="w-[34%]" />
    </div>
  );
}
