"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProjectCover } from "@/components/cards/project-cover";
import { Section } from "@/components/layout/section";
import { ArrowChip } from "@/components/ui/arrow-chip";
import type { Project } from "@/content/projects";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Up next: the following case's cover opens from a small frame to the full
 * screen as you scroll into it, its name over it. Click anywhere to fly in.
 */
export function NextProject({ project }: { project: Project }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-next-frame]",
          { clipPath: "inset(30% 32% 30% 32%)" },
          { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: true } },
        );
        gsap.fromTo("[data-next-title]", { yPercent: 60 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section ref={root} aria-label="Next case study">
      <Link href={`/work/${project.slug}`} className="group relative block h-svh overflow-hidden">
        <div data-next-frame="" className="absolute inset-0">
          <ProjectCover project={project} sizes="100vw" className="h-full w-full" />
          <div aria-hidden className="absolute inset-0 bg-ink/45 transition-colors duration-700 group-hover:bg-ink/25" />
        </div>
        <div className="px-page relative flex h-full flex-col items-center justify-center text-center text-paper">
          <p className="readout text-paper">Up next</p>
          <p data-next-title="" className="heading-xxl mt-[2rem] text-[min(var(--heading-xxl)*1.2,15vw)]">
            {project.title}
          </p>
          <span className="para-l mt-[2rem] inline-flex items-center gap-[0.6rem]">
            {project.subtitle}
            <ArrowChip direction="right" />
          </span>
        </div>
      </Link>
    </Section>
  );
}
