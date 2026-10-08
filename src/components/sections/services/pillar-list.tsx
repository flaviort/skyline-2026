"use client";

import Link from "next/link";
import { useRef } from "react";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { Media } from "@/components/ui/media";
import { getProject } from "@/content/projects";
import { pillars } from "@/content/services";
import { gsap, useGSAP } from "@/lib/gsap";
import { pad } from "@/lib/utils";

/**
 * The services page body: per pillar, its name sticks on the left in giant
 * type (filling with orange as you read through it) while its services
 * scroll past on the right, each with the cases that show it.
 */
export function PillarList() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-pillar-block]").forEach((block) => {
          gsap.fromTo(
            block.querySelector("[data-pillar-fill]"),
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: block, start: "top 30%", end: "bottom 70%", scrub: true } },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Running number across the pillars: 01 to 07.
  const offsets = pillars.map((_, index) => pillars.slice(0, index).reduce((sum, pillar) => sum + pillar.services.length, 0));

  return (
    <Section ref={root} className="px-page pb-[12rem]">
      {pillars.map((pillar, pillarIndex) => (
        <div key={pillar.name} data-pillar-block="" className="grid grid-cols-12 gap-(--grid-gap) border-t border-[color-mix(in_srgb,var(--color-ground)_18%,transparent)] pt-[4rem] pb-[10rem]">
          <div className="col-span-5 max-md:col-span-12">
            <div className="sticky top-[10rem]">
              <h2 className="heading-xl relative">
                <span className="text-[color-mix(in_srgb,var(--color-ground)_40%,transparent)]">{pillar.name}</span>
                <span data-pillar-fill="" aria-hidden className="absolute inset-0 text-orange">
                  {pillar.name}
                </span>
              </h2>
              <p className="para-l mt-[2rem] max-w-[30rem] text-mute">{pillar.line}</p>
            </div>
          </div>
          <div className="col-span-7 grid gap-[8rem] max-md:col-span-12 max-md:mt-[4rem] max-md:gap-[5rem]">
            {pillar.services.map((service, serviceIndex) => {
              const count = offsets[pillarIndex] + serviceIndex + 1;
              return (
                <Reveal key={service.slug} items="[data-rise]" stagger={0.06}>
                  <article id={service.slug} className="scroll-mt-[12rem]">
                    <p data-rise="" className="readout">
                      {pad(count)}
                    </p>
                    <h3 data-rise="" className="heading-m mt-[1.6rem]">
                      {service.name}
                    </h3>
                    <p data-rise="" className="para-l mt-[2rem] max-w-[56rem] text-mute">
                      {service.description}
                    </p>
                    <ul data-rise="" className="mt-[3rem] flex flex-wrap gap-[1.2rem]">
                      {service.work.map((slug) => {
                        const project = getProject(slug);
                        if (!project) return null;
                        return (
                          <li key={slug}>
                            <Link href={`/work/${slug}`} className="group flex items-center gap-[1.2rem] border border-[color-mix(in_srgb,var(--color-ground)_20%,transparent)] p-[0.6rem] pr-[1.6rem] transition-colors hover:border-orange">
                              <span className="relative block size-[5.6rem] overflow-hidden">
                                <Media media={project.cover} fill sizes="6rem" className="transition-transform duration-700 group-hover:scale-110" />
                              </span>
                              <span>
                                <span className="block text-[max(1.2rem,13px)] font-semibold">{project.title}</span>
                                <span className="readout mt-[0.4rem] block">{project.year}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      ))}
    </Section>
  );
}
