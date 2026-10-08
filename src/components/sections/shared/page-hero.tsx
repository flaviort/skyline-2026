"use client";

import { useRef, type ReactNode } from "react";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/type/eyebrow";
import { Heading, type HeadingLine } from "@/components/type/heading";
import { usePageEntrance } from "@/components/motion/use-page-entrance";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: HeadingLine[];
  intro?: string;
  /** Anything on the right of the intro: a 3D mark, a fact, a button */
  aside?: ReactNode;
  /** Under the intro row, full width */
  children?: ReactNode;
  className?: string;
};

/**
 * The top of every inner page: a small label, the giant stacked title that
 * thins near the cursor, and an intro line. Plays from the page cue (after
 * the launch intro or the route sweep).
 */
export function PageHero({ eyebrow, title, intro, aside, children, className }: PageHeroProps) {
  const root = useRef<HTMLElement>(null);

  usePageEntrance(
    (timeline) => {
      timeline.fromTo("[data-hero-rise]", { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 1.2, ease: "move", stagger: 0.1 }, 0.35);
    },
    { scope: root, offset: -0.3 },
  );

  return (
    <Section ref={root} className={cn("px-page pt-[16rem] pb-[8rem] max-md:pt-[12rem]", className)}>
      <Eyebrow reveal={{ split: "lines" }}>{eyebrow}</Eyebrow>
      <Heading as="h1" size="xxl" lines={title} weightHover reveal={{ split: "chars", delay: 0.1 }} className="mt-[2.4rem]" />
      {(intro || aside) && (
        <div className="mt-[6rem] grid grid-cols-12 items-end gap-(--grid-gap)">
          {intro && (
            <p data-hero-rise="" className="para-xl col-span-7 max-w-[60rem] font-normal max-lg:col-span-12">
              {intro}
            </p>
          )}
          {aside && (
            <div data-hero-rise="" className="col-span-4 col-start-9 justify-self-end max-lg:col-span-12 max-lg:col-start-1 max-lg:justify-self-start">
              {aside}
            </div>
          )}
        </div>
      )}
      {children}
    </Section>
  );
}
