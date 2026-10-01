"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useFitText } from "@/components/motion/use-fit-text";
import { useKineticText, type RevealOptions } from "@/components/motion/use-kinetic-text";

type LeadProps = {
  /** Each entry is one line; the reference always uses two */
  lines: string[];
  size?: "l" | "m";
  reveal?: RevealOptions | false;
  className?: string;
};

const SIZE = {
  l: "text-[3rem] leading-none",
  m: "text-[2rem] leading-none",
};

/** The two-line sentence that sits above a headline. */
export function Lead({ lines, size = "l", reveal = { split: "lines" }, className }: LeadProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  // Each line stays one line, shrinking on narrow screens if needed.
  useFitText(ref, { unit: "line" });
  useKineticText(ref, { reveal, targets: "[data-line]" });

  return (
    <p
      ref={ref}
      data-reveal={reveal ? "" : undefined}
      className={cn("w-full font-normal tracking-[-0.035em]", SIZE[size], className)}
    >
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, index) => (
        <span key={index} data-line="" aria-hidden className="block">
          {line}
        </span>
      ))}
    </p>
  );
}
