"use client";

import type { RefObject } from "react";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";

type ScrollAwayOptions = {
  /** Share of the scroll the content sinks back by: 0.35 leaves it moving at 65% speed */
  lag?: number;
};

/**
 * The section leaves slower than the scroll, so the next one slides over it
 * (good-fella.com's hero, measured: the content drops 0.35px per px scrolled,
 * linear, no fade). Runs from when the section's bottom meets the bottom of
 * the screen, the moment the next section shows, until it has gone off the
 * top. The section itself must clip (`overflow-clip`) so the sunk content
 * never shows under the next one. Off with reduced motion.
 */
export function useScrollAway(content: RefObject<HTMLElement | null>, { lag = 0.35 }: ScrollAwayOptions = {}) {
  useGSAP(
    () => {
      const element = content.current;
      const section = element?.parentElement;
      if (!element || !section) return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          element,
          { y: 0 },
          {
            y: () => window.innerHeight * lag,
            ease: "none",
            scrollTrigger: { trigger: section, start: "bottom bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
          },
        );
      });
      // Text reveals and fonts change the page height after the first layout.
      ScrollTrigger.refresh();
      return () => media.revert();
    },
    { dependencies: [lag] },
  );
}
