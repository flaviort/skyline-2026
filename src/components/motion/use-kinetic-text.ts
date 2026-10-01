"use client";

import { useRef, type RefObject } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { pointer, trackPointer } from "@/lib/pointer";
import { whenPageReady } from "@/lib/page-ready";

export type RevealOptions = {
  /** Split and animate by lines or by characters */
  split: "lines" | "chars";
  /** Seconds before the reveal starts, after the page is ready */
  delay?: number;
  /** Seconds between lines; characters use a quarter of it, like the reference */
  stagger?: number;
};

export type WeightOptions = {
  /** Weight at rest and with the pointer on top, for the grotesk */
  sans?: { rest: number; near: number };
  /** Same for accent lines (anything inside a `[data-accent]` element) */
  accent?: { rest: number; near: number };
  /** Distance in px at which the pointer stops affecting a character */
  radius?: number;
};

type Options = {
  reveal?: RevealOptions | false;
  weight?: WeightOptions | false;
  /** Elements to split inside the container; defaults to the container itself */
  targets?: string;
};

const SANS = { rest: 700, near: 200 };
// The reference trades weights: bold lines thin out, the light line thickens.
const ACCENT = { rest: 150, near: 700 };

/** Rebuilds a char's font-variation-settings so `wght` is driven by --wght
 *  while keeping any other variation axes intact. */
function variationSettings(el: HTMLElement) {
  const current = getComputedStyle(el).fontVariationSettings;
  const others =
    !current || current === "normal"
      ? []
      : current
          .split(",")
          .map((part) => part.trim())
          .filter((part) => !/^["']wght["']/.test(part));
  return ["'wght' var(--wght)", ...others].join(", ");
}

/**
 * Masked text reveal plus the cursor-driven weight effect from the reference,
 * on one shared SplitText instance. Text stays readable without JavaScript:
 * the hidden state is applied by GSAP right before animating, and a CSS
 * failsafe shows `[data-reveal]` content if this never runs.
 */
export function useKineticText<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { reveal = { split: "lines" }, weight = false, targets }: Options = {},
) {
  const revealed = useRef(false);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          fine: "(hover: hover) and (pointer: fine)",
        },
        (context) => {
          const { motion, fine } = context.conditions as { motion: boolean; fine: boolean };
          const show = () => root.setAttribute("data-revealed", "");

          if (!motion) {
            show();
            return;
          }

          const useWeight = Boolean(weight) && fine;
          const splitChars = useWeight || (reveal && reveal.split === "chars");
          const elements = targets ? Array.from(root.querySelectorAll<HTMLElement>(targets)) : [root];

          type Char = {
            el: HTMLElement;
            cx: number;
            cy: number;
            rest: number;
            near: number;
            last: number;
            set: (value: number) => void;
          };
          let chars: Char[] = [];
          const radius = (weight && weight.radius) || 400;
          let weightLive = false;
          let ready = false;
          let revealTween: gsap.core.Tween | null = null;

          const finish = () => {
            revealed.current = true;
            weightLive = useWeight;
            measure();
          };

          const measure = () => {
            for (const c of chars) {
              const r = c.el.getBoundingClientRect();
              c.cx = r.left + r.width / 2 + window.scrollX;
              c.cy = r.top + r.height / 2 + window.scrollY;
            }
          };

          const bindChars = (split: SplitText) => {
            if (!useWeight || !weight) return;
            chars = (split.chars as HTMLElement[]).map((el) => {
              const isAccent = Boolean(el.closest("[data-accent]"));
              const range = isAccent ? (weight.accent ?? ACCENT) : (weight.sans ?? SANS);
              el.style.setProperty("--wght", String(range.rest));
              el.style.fontVariationSettings = variationSettings(el);
              return {
                el,
                cx: 0,
                cy: 0,
                rest: range.rest,
                near: range.near,
                last: range.rest,
                set: gsap.quickTo(el, "--wght", { duration: 0.4, ease: "power2.out" }),
              };
            });
            requestAnimationFrame(measure);
          };

          const tick = () => {
            if (!weightLive || !pointer.lastMove) return;
            // Live page position: the pointer's viewport position plus the current
            // scroll, so scrolling (or anything moving under a still mouse) never
            // leaves a stale position that snaps on the next mouse move.
            const pageX = pointer.x + window.scrollX;
            const pageY = pointer.y + window.scrollY;
            for (const c of chars) {
              const distance = Math.hypot(pageX - c.cx, pageY - c.cy);
              const t = distance >= radius ? 0 : 1 - distance / radius;
              const value = c.rest + (c.near - c.rest) * t;
              if (Math.abs(value - c.last) >= 1) {
                c.last = value;
                c.set(value);
              }
            }
          };

          const split = SplitText.create(elements, {
            type: splitChars ? "chars,words,lines" : "lines,words",
            linesClass: "split-line",
            charsClass: "split-char",
            mask: "lines",
            autoSplit: true,
            // Components render their own screen-reader copy of the text.
            aria: "none",
            onSplit(self) {
              bindChars(self);
              if (!reveal || revealed.current) {
                show();
                return;
              }
              const pieces = reveal.split === "chars" ? self.chars : self.lines;
              const stagger = reveal.stagger ?? 0.07;
              gsap.set(pieces, { yPercent: 135 });
              show();
              // A resize before the reveal ends re-splits; the new tween picks
              // up where the page is (playing right away if already ready).
              revealTween = gsap.to(pieces, {
                yPercent: 0,
                duration: 1,
                ease: "expo.out",
                stagger: reveal.split === "chars" ? { each: stagger * 0.25, from: "start" } : stagger,
                delay: reveal.delay ?? 0,
                paused: !ready,
                onComplete: finish,
              });
              return revealTween;
            },
          });

          // Start the entrance once the page is ready (fonts loaded; part 11
          // will hand this over to the page transition).
          let cancelled = false;
          whenPageReady().then(() => {
            if (cancelled) return;
            ready = true;
            if (revealTween) revealTween.play();
            else finish();
          });

          if (useWeight) {
            trackPointer();
            gsap.ticker.add(tick);
            window.addEventListener("resize", measure, { passive: true });
            document.fonts?.ready.then(measure);
          }

          return () => {
            cancelled = true;
            gsap.ticker.remove(tick);
            window.removeEventListener("resize", measure);
            for (const c of chars) {
              c.el.style.removeProperty("--wght");
              c.el.style.fontVariationSettings = "";
            }
            split.revert();
          };
        },
      );

      return () => mm.revert();
    },
    { scope: ref, dependencies: [] },
  );
}
