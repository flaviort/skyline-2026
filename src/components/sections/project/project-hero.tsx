"use client";

import { useRef } from "react";
import { ProjectCover } from "@/components/cards/project-cover";
import { Section } from "@/components/layout/section";
import { usePageEntrance } from "@/components/motion/use-page-entrance";
import { useScrollLight } from "@/components/motion/use-scroll-light";
import { Heading } from "@/components/type/heading";
import { DrawLineLink } from "@/components/ui/draw-line-link";
import type { Project } from "@/content/projects";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Top of a case study: the client name huge, the facts in a ground-control
 * row, then the cover (the same named element as on the list, so it lands
 * here from wherever it was clicked) which drifts slower than the page. The
 * description lights up word by word as it scrolls through.
 */
export function ProjectHero({ project }: { project: Project }) {
  const root = useRef<HTMLElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  const description = useRef<HTMLParagraphElement>(null);
  useScrollLight(description);

  usePageEntrance(
    (timeline) => {
      timeline.fromTo("[data-fact]", { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, duration: 1, ease: "move", stagger: 0.06 }, 0.3);
    },
    { scope: root, offset: -0.3 },
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(cover.current, { yPercent: 18, ease: "none", scrollTrigger: { trigger: cover.current, start: "top top+=200", end: "bottom top", scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const facts = [
    { label: "Services", value: project.services.join(", ") },
    { label: "Industry", value: project.industries.join(", ") },
    { label: "Year", value: String(project.year) },
  ];

  return (
    <Section ref={root} className="pt-[16rem] max-md:pt-[12rem]">
      <div className="px-page">
        <p className="readout" data-fact="">
          Case study / {project.subtitle}
        </p>
        <Heading as="h1" size="xxl" lines={[{ text: project.title }]} weightHover reveal={{ split: "chars", delay: 0.1 }} className="mt-[2.4rem] text-[min(var(--heading-xxl)*1.25,16vw)]" />
        <dl className="mt-[5rem] grid grid-cols-4 gap-(--grid-gap) border-t border-[color-mix(in_srgb,var(--color-ground)_18%,transparent)] pt-[2rem] max-md:grid-cols-2 max-md:gap-y-[2rem]">
          {facts.map((fact) => (
            <div key={fact.label} data-fact="">
              <dt className="readout">{fact.label}</dt>
              <dd className="para-m mt-[0.8rem]">{fact.value}</dd>
            </div>
          ))}
          {project.url && (
            <div data-fact="" className="flex items-end justify-end max-md:justify-start">
              <dt className="sr-only">Website</dt>
              <dd>
                <DrawLineLink href={project.url} label="Visit the site" chip="up" className="para-m font-medium" />
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-[4rem] overflow-hidden">
        <div ref={cover}>
          <ProjectCover project={project} priority sizes="100vw" className="h-[100svh] w-full max-md:h-[70svh]" />
        </div>
      </div>

      <div className="px-page py-[14rem] max-md:py-[8rem]">
        <p ref={description} className="max-w-[90rem] text-(length:--heading-xs) leading-[1.15] font-medium tracking-[-0.035em] max-md:text-[1.6rem]">
          {project.description}
        </p>
      </div>
    </Section>
  );
}
