"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { isLite } from "@/lib/lite";
import { whenPageReady } from "@/lib/page-ready";
import { BlockMarks, blockReveal } from "./block-reveal";
import { cn } from "@/lib/utils";

type WordSwapProps = {
  words: string[];
  /** Seconds each word stays before the next one launches */
  hold?: number;
  /** Seconds after the page cover is gone before the first word shows (negative: while it is leaving) */
  delay?: number;
  /** How the first word arrives: rising like the swaps, or through a block reveal (part 11a) */
  reveal?: "land" | "block";
  /** Seconds the first word stays (the banner waits for Nova's entrance to finish) */
  firstHold?: number;
  className?: string;
  /** Classes for the small list of all words under the big one; omit to hide it */
  listClassName?: string;
};

// Weights the letters travel between: they land thin and ignite to heavy.
const THIN = 150;
const HEAVY = 800;
/** How far letters travel out of and into the line, in % of their height: fully clear of the mask */
const OFFSET = 170;

/**
 * A big word that swaps through a list (banner, part 01). The outgoing
 * letters lift off one after another with a little stretch, like a launch;
 * the incoming ones rise from below, land with a small squash and ignite from
 * a hairline weight to heavy. The word spans the whole line (nothing sits
 * beside it), so words of any length fit without measuring. Pauses while off screen or in a background tab; with reduced motion
 * the first word simply stays. Screen readers get the whole sentence from the
 * heading instead (this is aria-hidden).
 */
export function WordSwap({ words, hold = 2.6, delay = 0.3, firstHold = hold, reveal = "land", className, listClassName }: WordSwapProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const box = root.current;
      if (!box) return;
      const layers = gsap.utils.toArray<HTMLElement>("[data-word]", box);
      const chars = (index: number) => gsap.utils.toArray<HTMLElement>("[data-char]", layers[index]);
      // The progress line moves to the active word on each render, so look it up each time.
      const progressLine = () => box.parentElement?.querySelector<HTMLElement>("[data-progress]") ?? null;

      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" },
        (context) => {
          const { motion } = context.conditions as { motion: boolean };
          gsap.set(layers, { autoAlpha: 0 });
          gsap.set(layers[0], { autoAlpha: 1 });
          if (!motion) {
            gsap.set(chars(0), { "--wght": HEAVY });
            return;
          }

          let current = 0;
          let next: gsap.core.Tween | null = null;
          let visible = true;
          let running: gsap.core.Timeline | null = null;
          let filling: gsap.core.Tween | null = null;

          let first = true;
          const countdown = () => {
            const wait = first ? firstHold : hold;
            first = false;
            const line = progressLine();
            filling = line ? gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: wait, ease: "none" }) : null;
            next = gsap.delayedCall(wait, swap);
          };

          // The first word lands like the others, with no word leaving.
          const land = (index: number, at: number, timeline: gsap.core.Timeline) =>
            timeline
              .fromTo(
                chars(index),
                { yPercent: OFFSET, scaleY: 1.35 },
                { yPercent: 0, scaleY: 1, duration: 0.9, ease: "power4.out", stagger: 0.035 },
                at,
              )
              // The weight ignites as each letter settles.
              .fromTo(
                chars(index),
                { "--wght": THIN },
                { "--wght": HEAVY, duration: 0.7, ease: "power2.in", stagger: 0.035 },
                at + 0.15,
              );

          function swap() {
            if (!visible) return;
            const from = current;
            const to = (current + 1) % words.length;
            current = to;
            setActive(to);
            running = gsap
              .timeline({ onComplete: countdown })
              .set(layers[to], { autoAlpha: 1 })
              .to(chars(from), {
                yPercent: -OFFSET,
                scaleY: 1.3,
                duration: 0.55,
                ease: "power3.in",
                stagger: 0.025,
              })
              .set(layers[from], { autoAlpha: 0 });
            land(to, 0.3, running);
          }

          let intro: gsap.core.Timeline;
          if (isLite()) {
            // Phones: the first word is simply there; the swapping starts on cue.
            intro = gsap.timeline({ paused: true, onComplete: countdown });
          } else if (reveal === "block") {
            gsap.set(chars(0), { "--wght": HEAVY });
            intro = blockReveal(layers[0], chars(0)).pause();
            intro.eventCallback("onComplete", countdown);
          } else {
            intro = gsap.timeline({ paused: true, onComplete: countdown });
            land(0, 0, intro);
          }
          let start: gsap.core.Tween | null = null;
          let cancelled = false;
          whenPageReady().then(({ clearIn }) => {
            if (!cancelled) start = gsap.delayedCall(Math.max(0, clearIn + delay), () => void intro.play());
          });

          // Hold still while off screen or in a background tab.
          const pause = (stop: boolean) => {
            visible = !stop;
            for (const animation of [next, running, filling]) {
              if (stop) animation?.pause();
              else animation?.resume();
            }
          };
          const observer = new IntersectionObserver(([entry]) => pause(!entry.isIntersecting));
          observer.observe(box);
          const onVisibility = () => pause(document.hidden);
          document.addEventListener("visibilitychange", onVisibility);

          return () => {
            cancelled = true;
            start?.kill();
            observer.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            next?.kill();
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root, dependencies: [words.join("|"), hold, delay, firstHold, reveal] },
  );

  return (
    <>
      <span
        ref={root}
        aria-hidden
        className={cn("relative block overflow-hidden pb-[0.18em]", className)}
      >
        {/* Holds the line height; the words sit on top of it. */}
        <span className="invisible">{words[0]}</span>
        {words.map((word, index) => (
          // Only the first word shows before the script takes over.
          <span key={word} data-word className={cn("absolute bottom-[0.18em] left-0 whitespace-nowrap", index > 0 && "invisible")}>
            {Array.from(word).map((char, index) => (
              <span
                key={index}
                data-char
                className="inline-block origin-bottom [font-variation-settings:'wght'_var(--wght,800)]"
              >
                {char}
              </span>
            ))}
            {index === 0 && reveal === "block" && <BlockMarks />}
          </span>
        ))}
      </span>
      {listClassName && (
        <span aria-hidden className={cn("flex flex-wrap gap-x-[1.8rem] gap-y-[0.6rem]", listClassName)}>
          {words.map((word, index) => (
            <span key={word} className={cn("relative transition-colors duration-500", index === active ? "text-ground" : "text-mute")}>
              {word}
              {index === active && (
                <span data-progress className="absolute -bottom-[0.6em] left-0 h-px w-full origin-left scale-x-0 bg-orange" />
              )}
            </span>
          ))}
        </span>
      )}
    </>
  );
}
