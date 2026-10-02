"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { ArrowChip, type ChipColor } from "./arrow-chip";
import type { Direction } from "./icon";
import { nextSquiggle, SQUIGGLES } from "./squiggles";

const STROKE: Record<ChipColor, string> = {
  orange: "text-orange",
  ink: "text-ink",
  paper: "text-paper",
  cobalt: "text-cobalt",
  lilac: "text-lilac",
  visor: "text-visor",
};

type DrawLineLinkProps = {
  href: string;
  label: string;
  /** Squiggle color; the chip uses the same token */
  color?: ChipColor;
  /** Arrow chip direction, or false for no chip */
  chip?: Direction | false;
  /** Keep the squiggle drawn (current page in menus) */
  persist?: boolean;
  /** `menu`: the header's small uppercase links, no chip */
  variant?: "default" | "menu";
  className?: string;
};

const VARIANT = {
  default: "inline-flex items-center gap-[0.4em] leading-none tracking-[-0.03em]",
  menu: "inline-flex items-center text-[max(1rem,12px)] leading-none uppercase font-semibold tracking-[-0.02em]",
};

/**
 * Text link with a hand-drawn squiggle that draws itself on hover and
 * an arrow chip. Hash links scroll smoothly through Lenis.
 */
export function DrawLineLink({
  href,
  label,
  color = "orange",
  chip = "right",
  persist = false,
  variant = "default",
  className,
}: DrawLineLinkProps) {
  const root = useRef<HTMLAnchorElement>(null);
  const path = useRef<SVGPathElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const line = path.current;
      if (!line) return;
      // Hidden while undrawn: a round cap at 0% would still paint a dot.
      gsap.set(line, { drawSVG: persist ? "100%" : "0%", autoAlpha: persist ? 1 : 0 });
      return () => gsap.killTweensOf(line);
    },
    { scope: root, dependencies: [persist] },
  );

  const draw = () => {
    const line = path.current;
    if (persist || !line) return;
    gsap.killTweensOf(line);
    line.setAttribute("d", nextSquiggle());
    gsap.fromTo(line, { drawSVG: "0%", autoAlpha: 1 }, { drawSVG: "100%", duration: 0.5, ease: "power2.inOut" });
  };

  const erase = () => {
    const line = path.current;
    if (persist || !line) return;
    gsap.to(line, {
      drawSVG: "100% 100%",
      duration: 0.5,
      ease: "power2.inOut",
      overwrite: "auto",
      onComplete: () => void gsap.set(line, { autoAlpha: 0 }),
    });
  };

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.2 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Link
      ref={root}
      href={href}
      onClick={onClick}
      onMouseEnter={draw}
      onMouseLeave={erase}
      onFocus={draw}
      onBlur={erase}
      aria-current={variant === "menu" && persist ? "page" : undefined}
      className={cn(VARIANT[variant], className)}
    >
      <span className="relative pb-[0.15em]">
        {label}
        <svg
          aria-hidden
          viewBox="0 0 310 40"
          preserveAspectRatio="none"
          fill="none"
          className={cn("absolute top-full left-0 h-[0.55em] w-full overflow-visible", STROKE[color])}
        >
          <path
            ref={path}
            d={SQUIGGLES[0]}
            stroke="currentColor"
            strokeWidth={10}
            strokeLinecap="round"
            visibility={persist ? undefined : "hidden"}
          />
        </svg>
      </span>
      {chip && variant !== "menu" && <ArrowChip color={color} direction={chip} />}
    </Link>
  );
}
