"use client";

import { useRef } from "react";
import { Section } from "@/components/layout/section";
import { useScrollLight } from "@/components/motion/use-scroll-light";
import { Eyebrow } from "@/components/type/eyebrow";
import { cn } from "@/lib/utils";

type StatementProps = {
  eyebrow?: string;
  text: string;
  theme?: "light" | "dark";
  className?: string;
};

/** One big sentence whose words light up as it scrolls through. */
export function Statement({ eyebrow, text, theme = "dark", className }: StatementProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  useScrollLight(ref);
  return (
    <Section theme={theme} navTheme={theme} data-nova-cover={theme === "light" ? "" : undefined} className={cn("px-page py-[16rem] max-md:py-[8rem]", className)}>
      {eyebrow && <Eyebrow className="mb-[3rem]">{eyebrow}</Eyebrow>}
      <p ref={ref} className="text-(length:--heading-m) leading-[1.02] font-medium tracking-[-0.045em] max-md:text-(length:--heading-s)">
        {text}
      </p>
    </Section>
  );
}
