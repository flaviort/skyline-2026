"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { whenPageReady } from "@/lib/page-ready";

type PageEntranceOptions = {
  /** Element that scopes the selectors used inside `build` */
  scope?: RefObject<HTMLElement | null>;
  /**
   * Seconds relative to the moment the cover is fully gone: negative starts
   * while it is still leaving. Never earlier than the cue itself.
   */
  offset?: number;
};

/**
 * A component's part of the page entrance (part 11). `build` fills a paused
 * timeline right away, so the starting states are set while the cover still
 * hides the page; it plays when the cover starts to leave. A component in the
 * root layout mounts once, so it only ever plays after the first load. With
 * reduced motion nothing is built and everything simply shows.
 */
export function usePageEntrance(build: (timeline: gsap.core.Timeline) => void, { scope, offset = 0 }: PageEntranceOptions = {}) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ paused: true });
        build(timeline);
        let cancelled = false;
        let start: gsap.core.Tween | null = null;
        whenPageReady().then(({ clearIn }) => {
          if (cancelled) return;
          start = gsap.delayedCall(Math.max(0, clearIn + offset), () => void timeline.play());
        });
        return () => {
          cancelled = true;
          start?.kill();
        };
      });
      return () => mm.revert();
    },
    { scope, dependencies: [] },
  );
}
