"use client";

import { useLenis } from "lenis/react";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

type ScrollCueProps = {
  href: string;
  label: string;
  className?: string;
};

/**
 * Round "Scroll" button with orange rings rippling out of it, the same
 * beacon as Nova's antenna (banner, part 01). Scrolls smoothly to its target.
 * The ripple stops with reduced motion (styles in globals.css, `.scroll-cue`).
 */
export function ScrollCue({ href, label, className }: ScrollCueProps) {
  const lenis = useLenis();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = href.startsWith("#") ? document.querySelector<HTMLElement>(href) : null;
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.2 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <a href={href} onClick={onClick} className={cn("scroll-cue", className)}>
      <span aria-hidden className="scroll-cue__ring" />
      <span aria-hidden className="scroll-cue__ring scroll-cue__ring--late" />
      <span className="readout text-ground">{label}</span>
    </a>
  );
}
