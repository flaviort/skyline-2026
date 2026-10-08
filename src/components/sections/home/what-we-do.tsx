"use client";

import Link from "next/link";
import { useRef } from "react";
import { Section } from "@/components/layout/section";
import { SpinningLogo } from "@/components/three/spinning-logo";
import { Heading } from "@/components/type/heading";
import { DrawLineLink } from "@/components/ui/draw-line-link";
import { whatWeDo } from "@/content/home";
import { pillars } from "@/content/services";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { pad } from "@/lib/utils";

/**
 * Part 05: the three pillars around a chrome S that spins with the scroll.
 * From tablets up the section pins for a screen per pillar: each pillar's
 * name rises letter by letter and leaves upward as the next one arrives,
 * with its services and its line beside it. Phones (and reduced motion) get
 * the three pillars one under the other.
 */
export function WhatWeDo() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-pillar]");
        const splits = panels.map((panel) => SplitText.create(panel.querySelector("[data-pillar-name]"), { type: "chars", mask: "chars" }));
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage.current, start: "top top", end: `+=${panels.length * 100}%`, pin: true, scrub: 0.6 },
        });
        panels.forEach((panel, index) => {
          const chars = splits[index].chars;
          const details = panel.querySelectorAll("[data-pillar-detail]");
          const counter = panel.querySelector("[data-pillar-count]");
          if (index > 0) {
            timeline.set(panel, { autoAlpha: 1 }, index);
            timeline.fromTo(chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.02, duration: 0.4 }, index);
            timeline.fromTo([...details, counter], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.3 }, index + 0.15);
          }
          if (index < panels.length - 1) {
            timeline.to(chars, { yPercent: -110, stagger: 0.02, duration: 0.4 }, index + 0.6);
            timeline.to([...details, counter], { autoAlpha: 0, y: -40, stagger: 0.03, duration: 0.3 }, index + 0.6);
            timeline.set(panel, { autoAlpha: 0 }, index + 1);
          }
        });
        gsap.set(panels.slice(1), { autoAlpha: 0 });
        return () => splits.forEach((split) => split.revert());
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section ref={root} id="what-we-do" className="relative">
      <div ref={stage} className="px-page relative flex flex-col pt-[10rem] pb-[4rem] md:h-svh md:overflow-hidden max-md:pb-[8rem]">
        <div className="flex items-start justify-between gap-[2rem]">
          <Heading lines={whatWeDo.title} size="m" reveal={{ split: "chars", scroll: true }} className="w-auto" />
          <DrawLineLink href={whatWeDo.link.href} label={whatWeDo.link.label} className="para-l font-medium whitespace-nowrap" />
        </div>

        <SpinningLogo
          finish="chrome"
          speed={0.5}
          scrollBoost={2.2}
          className="pointer-events-auto absolute top-[44%] left-1/2 aspect-square w-[min(44rem,52svh)] -translate-x-1/2 -translate-y-1/2 max-md:relative max-md:top-auto max-md:left-auto max-md:mx-auto max-md:my-[4rem] max-md:translate-x-0 max-md:translate-y-0"
        />

        <div className="relative md:mt-auto md:grid">
          {pillars.map((pillar, index) => (
            <article key={pillar.name} data-pillar="" className="relative w-full md:[grid-area:1/1] max-md:mt-[6rem]">
              <p data-pillar-count="" className="readout mb-[1.6rem]">
                {pad(index + 1)} / {pad(pillars.length)}
              </p>
              <div className="grid grid-cols-12 items-end gap-(--grid-gap)">
                <h3 data-pillar-name="" className="heading-xxl col-span-8 text-[min(var(--heading-xxl)*1.25,10.5vw,22svh)] whitespace-nowrap max-md:col-span-12 max-md:text-[15vw]">
                  {pillar.name}
                </h3>
                <div className="col-span-4 pb-[1rem] max-md:col-span-12">
                  <p data-pillar-detail="" className="para-l">
                    {pillar.line}
                  </p>
                  <ul className="mt-[2rem] grid gap-[0.6rem]">
                    {pillar.services.map((service) => (
                      <li key={service.slug} data-pillar-detail="">
                        <Link href={`/services#${service.slug}`} className="readout text-ground transition-colors hover:text-orange">
                          + {service.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
