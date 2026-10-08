"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type MarqueeProps = {
  children: ReactNode;
  /** Seconds for one full loop at rest */
  duration?: number;
  /** -1 runs right to left (default), 1 left to right */
  direction?: 1 | -1;
  /** Scrolling speeds it up and turns it around with the scroll direction */
  scrollReactive?: boolean;
  className?: string;
  /** Accessible text for the whole row; the moving copies are hidden */
  label?: string;
};

/**
 * An endless row. The content is repeated so the loop never shows a gap.
 * Scroll speed pushes it faster and flips it with the scroll direction,
 * then it eases back to its own pace. Pauses off screen; still with reduced motion.
 */
export function Marquee({ children, duration = 30, direction = -1, scrollReactive = true, className, label }: MarqueeProps) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Each copy is half the track: moving by -50% lands on an identical frame.
        const loop = gsap.fromTo(track.current, { xPercent: direction < 0 ? 0 : -50 }, { xPercent: direction < 0 ? -50 : 0, duration, ease: "none", repeat: -1 });
        let heading = 1;
        const trigger = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? loop.resume() : loop.pause()),
          onUpdate: (self) => {
            if (!scrollReactive) return;
            const velocity = self.getVelocity();
            heading = velocity < 0 ? -1 : velocity > 0 ? 1 : heading;
            const boost = 1 + Math.min(6, Math.abs(velocity) / 400);
            gsap.to(loop, { timeScale: heading * boost, duration: 0.2, overwrite: true });
            gsap.to(loop, { timeScale: heading, duration: 1.2, delay: 0.2, ease: "power2.out" });
          },
        });
        return () => {
          trigger.kill();
          loop.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={cn("overflow-hidden", className)} role={label ? "group" : undefined} aria-label={label}>
      <div ref={track} className="flex w-max" aria-hidden={label ? true : undefined}>
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
