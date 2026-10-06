"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useKineticText, type RevealOptions } from "@/components/motion/use-kinetic-text";

type EyebrowProps = {
  children: string;
  as?: "p" | "span" | "h2";
  reveal?: RevealOptions | false;
  className?: string;
};

/** Small muted uppercase label above a heading, in the readout's style. */
export function Eyebrow({ children, as: Tag = "p", reveal = { split: "lines", scroll: true }, className }: EyebrowProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  useKineticText(ref, { reveal });
  return (
    <Tag ref={ref} data-reveal={reveal ? "" : undefined} className={cn("readout text-[max(1.17rem,11px)]", className)}>
      {children}
    </Tag>
  );
}
