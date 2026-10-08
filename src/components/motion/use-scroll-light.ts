"use client";

import type { RefObject } from "react";
import { SplitText, gsap, useGSAP } from "@/lib/gsap";

type ScrollLightOptions = {
  /** Opacity of a word before it lights up (0.6 keeps even body-size text at 4.5:1 or more on both themes, WCAG AA) */
  dim?: number;
};

/**
 * Words light up one by one as the text scrolls through the screen, tied to
 * the scroll (scrubbed): from dim to full, starting when the text's top is at
 * 80% of the viewport and done when its bottom reaches 55%. Full strength
 * with reduced motion or without JavaScript.
 */
export function useScrollLight(text: RefObject<HTMLElement | null>, { dim = 0.6 }: ScrollLightOptions = {}) {
  useGSAP(
    () => {
      const element = text.current;
      if (!element) return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(element, { type: "words", aria: "none" });
        gsap.fromTo(
          split.words,
          { opacity: dim },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: element, start: "top 80%", end: "bottom 55%", scrub: true },
          },
        );
        return () => split.revert();
      });
      return () => media.revert();
    },
    { dependencies: [dim] },
  );
}
