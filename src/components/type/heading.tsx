"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useFitText } from "@/components/motion/use-fit-text";
import { useKineticText, type RevealOptions, type WeightOptions } from "@/components/motion/use-kinetic-text";

export type HeadingLine = {
  text: string;
  /** Set this line as the thin accent line */
  accent?: boolean;
};

type HeadingSize = "xxl" | "xl" | "l" | "m" | "s" | "xs" | "xxs";

const SIZE: Record<HeadingSize, string> = {
  xxl: "heading-xxl",
  xl: "heading-xl",
  l: "heading-l",
  m: "heading-m",
  s: "heading-s",
  xs: "heading-xs",
  xxs: "heading-xxs",
};

type HeadingProps = {
  as?: "h1" | "h2" | "h3" | "p";
  size?: HeadingSize;
  /** One entry per line: bold lines plus a thin accent line, like the reference's stack */
  lines: HeadingLine[];
  reveal?: RevealOptions | false;
  /** Cursor weight effect; true uses the reference's weights */
  weightHover?: WeightOptions | boolean;
  /** Shrink the size when the longest word would not fit the column (default on) */
  fit?: boolean;
  className?: string;
};

/**
 * The signature headline: stacked uppercase grotesk lines where any line can
 * switch to the thin accent weight. Reveals and reacts to the cursor through
 * useKineticText.
 */
export function Heading({
  as: Tag = "h2",
  size = "xl",
  lines,
  reveal = { split: "chars" },
  weightHover = false,
  fit = true,
  className,
}: HeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  // Fit first: the split and the weight effect then measure the fitted size.
  useFitText(ref, { unit: "word", min: fit ? 0.4 : 1 });

  useKineticText(ref, {
    reveal,
    weight: weightHover === true ? {} : weightHover,
    targets: "[data-line]",
  });

  return (
    <Tag
      ref={ref}
      data-reveal={reveal ? "" : undefined}
      className={cn("w-full", SIZE[size], className)}
    >
      <span className="sr-only">{lines.map((line) => line.text).join(" ")}</span>
      {lines.map((line, index) => (
        <span
          key={index}
          data-line=""
          data-accent={line.accent ? "" : undefined}
          // The accent thickens near the cursor; fit it as if partly thickened so it never overflows.
          data-fit-weight={line.accent && weightHover ? "420" : undefined}
          aria-hidden
          className={cn("block", line.accent && "accent")}
        >
          {line.text}
        </span>
      ))}
    </Tag>
  );
}
