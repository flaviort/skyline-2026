import type { ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** Width of the orange block, in em of the line */
const BLOCK = 0.32;
/** Width it narrows to at the end, a caret after the text */
const CARET = 0.07;

/**
 * The bar and the orange block that reveal a line (part 11a, after the
 * reference's hero build). Goes inside any `relative inline-block` element
 * that holds the text; hidden until `blockReveal` runs, so without
 * JavaScript or with reduced motion the text simply shows. The marks run a
 * little past the box on the right: tight tracking lets the last letter's
 * ink overhang it.
 */
export function BlockMarks() {
  return (
    <span aria-hidden className="block-reveal__track">
      <span data-block-bar className="block-reveal__bar" />
      <span data-block-caret className="block-reveal__block" />
    </span>
  );
}

type BlockRevealProps = {
  children: ReactNode;
  className?: string;
};

/** A line of text ready for `blockReveal`: the text plus its marks. */
export function BlockReveal({ children, className }: BlockRevealProps) {
  return (
    <span data-block-reveal className={cn("relative inline-block", className)}>
      <span data-block-text>{children}</span>
      <BlockMarks />
    </span>
  );
}

/**
 * Reveals one line: an off-white bar grows across it with the orange block on
 * its leading edge, the text appears under the full bar, the bar pulls back
 * to the right with the block on its trailing edge, and the block ends as a
 * caret after the text that blinks out. About 1.3s. `text` is what starts
 * hidden (defaults to the `[data-block-text]` inside `box`).
 */
export function blockReveal(box: HTMLElement, text: gsap.TweenTarget = box.querySelector("[data-block-text]")) {
  const bar = box.querySelector<HTMLElement>("[data-block-bar]");
  const block = box.querySelector<HTMLElement>("[data-block-caret]");
  const timeline = gsap.timeline();
  if (!bar || !block) return timeline;

  // Hidden now, not when the timeline reaches it: it is usually built paused
  // under a cover and played later.
  gsap.set(text, { autoAlpha: 0 });
  const p = { grow: 0, retract: 0, back: 0 };
  const render = () => {
    bar.style.left = `${p.retract * 100}%`;
    bar.style.width = `${(p.grow - p.retract) * 100}%`;
    // Growing: the block rides inside the bar's leading edge. Pulling back:
    // it sits on the trailing edge, where the text is coming out.
    block.style.left = p.back ? `${p.retract * 100}%` : `max(0em, calc(${p.grow * 100}% - ${BLOCK}em))`;
  };

  return timeline
    .set(p, { grow: 0, retract: 0, back: 0, onComplete: render })
    .set(block, { width: `${BLOCK}em`, autoAlpha: 1 })
    .set(bar, { autoAlpha: 1 })
    .to(p, { grow: 1, duration: 0.5, ease: "power3.inOut", onUpdate: render })
    .set(text, { autoAlpha: 1 })
    .set(p, { back: 1, onComplete: render })
    .to(p, { retract: 1, duration: 0.55, ease: "power3.inOut", onUpdate: render })
    .set(bar, { autoAlpha: 0 })
    .to(block, { width: `${CARET}em`, duration: 0.15, ease: "power2.out" })
    .set(block, { autoAlpha: 0 }, "+=0.12")
    .set(block, { autoAlpha: 1 }, "+=0.12")
    .set(block, { autoAlpha: 0 }, "+=0.12");
}
