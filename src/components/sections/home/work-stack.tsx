"use client";

import { useRef } from "react";
import { ProjectCard } from "@/components/cards/project-card";
import { Section } from "@/components/layout/section";
import { Heading } from "@/components/type/heading";
import { Lead } from "@/components/type/lead";
import { Badge } from "@/components/ui/badge";
import { DrawLineLink } from "@/components/ui/draw-line-link";
import { recentWork } from "@/content/home";
import { projects } from "@/content/projects";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Part 04: recent work as a deck. Each case is a card on its brand color
 * that sticks under the menu while the next one slides over it; the card
 * underneath sinks back, tips over a little and dims, so the deck reads as
 * a physical stack. A badge turns with the scroll.
 */
export function WorkStack() {
  const root = useRef<HTMLElement>(null);
  const list = projects.slice(0, recentWork.count);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
        cards.forEach((card, index) => {
          const next = cards[index + 1];
          if (!next) return;
          gsap.to(card.firstElementChild, {
            scale: 0.86,
            rotate: index % 2 ? 2.5 : -2.5,
            filter: "brightness(0.35)",
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=96", scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section ref={root} id="work" className="px-page relative pt-[16rem] pb-[10rem] max-md:pt-[10rem]">
      <div className="grid grid-cols-12 items-end gap-(--grid-gap)">
        <div className="col-span-8 max-md:col-span-12">
          <Lead lines={recentWork.lead} size="m" reveal={{ split: "lines", scroll: true }} className="text-mute" />
          <Heading lines={recentWork.title} size="xxl" weightHover reveal={{ split: "chars", scroll: true }} className="mt-[2.4rem]" />
        </div>
        <div className="col-span-4 flex flex-col items-end gap-[3rem] max-md:col-span-12 max-md:items-start">
          <Badge text={recentWork.badge} className="w-[16rem]" />
          <DrawLineLink href={recentWork.link.href} label={recentWork.link.label} className="para-xl font-medium" />
        </div>
      </div>

      <div className="mt-[8rem]">
        {list.map((project, index) => (
          <div key={project.slug} data-stack-card="" className="sticky top-[8rem] h-[calc(100svh-11rem)] pb-[3rem] max-md:h-auto max-md:min-h-[80svh]">
            <div className="h-full origin-[50%_0%] will-change-transform">
              <ProjectCard project={project} index={index} total={list.length} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
