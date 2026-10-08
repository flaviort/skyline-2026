"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { whenPageReady } from "@/lib/page-ready";

type RevealProps = {
  children: ReactNode;
  as?: "div" | "ul" | "ol" | "section" | "p";
  className?: string;
  /** Which descendants rise in, one after another; the direct children by default */
  items?: string;
  stagger?: number;
  /** How far each item travels, in % of its own height */
  distance?: number;
  /** Also tilt each item as it rises */
  tilt?: boolean;
  /** Where the trigger fires (ScrollTrigger start) */
  start?: string;
};

/**
 * Items rise and fade in once as the group scrolls into view, after the page
 * cue. Visible without JavaScript; with reduced motion nothing moves.
 */
export function Reveal({ children, as: Tag = "div", className, items, stagger = 0.08, distance = 40, tilt = false, start = "top 88%" }: RevealProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = items ? gsap.utils.toArray<HTMLElement>(items, root.current) : Array.from(root.current?.children ?? []);
        if (!targets.length) return;
        gsap.set(targets, { autoAlpha: 0, yPercent: distance, rotate: tilt ? 4 : 0, transformOrigin: "0% 100%" });
        let cancelled = false;
        whenPageReady().then(() => {
          if (cancelled) return;
          gsap.to(targets, {
            autoAlpha: 1,
            yPercent: 0,
            rotate: 0,
            duration: 1.1,
            ease: "move",
            stagger,
            scrollTrigger: { trigger: root.current, start, once: true },
          });
        });
        return () => {
          cancelled = true;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- one ref type for the few tags allowed
    <Tag ref={root as any} className={className}>
      {children}
    </Tag>
  );
}
