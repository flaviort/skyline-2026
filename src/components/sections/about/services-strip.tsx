"use client";

import Link from "next/link";
import { useRef } from "react";
import { Section } from "@/components/layout/section";
import { Heading } from "@/components/type/heading";
import { ArrowChip } from "@/components/ui/arrow-chip";
import { aboutPage } from "@/content/pages";
import { services } from "@/content/services";
import { gsap, useGSAP } from "@/lib/gsap";
import { pad } from "@/lib/utils";

/**
 * The seven services as a row of tall cards that the vertical scroll drives
 * sideways while the section is pinned. Each card tips upright as it comes
 * in from the right. Phones and reduced motion get a native swipe row.
 */
export function ServicesStrip() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const distance = () => track.current!.scrollWidth - window.innerWidth;
        const slide = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
        });
        gsap.utils.toArray<HTMLElement>("[data-strip-card]").forEach((card) => {
          gsap.fromTo(card, { rotate: 6, yPercent: 8 }, { rotate: 0, yPercent: 0, ease: "none", scrollTrigger: { trigger: card, containerAnimation: slide, start: "left right", end: "center center", scrub: true } });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section ref={root} theme="light" navTheme="light" data-nova-cover="" className="overflow-hidden">
      <div className="flex min-h-svh flex-col justify-center py-[10rem] max-md:py-[6rem]">
        <div className="px-page mb-[5rem] flex items-end justify-between gap-[2rem] max-md:flex-col max-md:items-start">
          <Heading lines={[{ text: "What we" }, { text: "bring aboard", accent: true }]} size="l" reveal={{ split: "chars", scroll: true }} className="w-auto" />
          <p className="para-l max-w-[36rem] text-mute">{aboutPage.servicesLead}</p>
        </div>
        <ul ref={track} className="px-page flex w-max gap-(--grid-gap) max-md:w-full max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto">
          {services.map((service, index) => (
            <li key={service.slug} data-strip-card="" className="w-[36rem] shrink-0 origin-bottom-left max-md:w-[80vw] max-md:snap-start">
              <Link href={`/services#${service.slug}`} className="group flex h-[48rem] flex-col justify-between bg-ink p-[2.8rem] text-ground transition-colors duration-500 hover:bg-orange hover:text-ink max-md:h-[40rem]">
                <span className="readout flex justify-between text-current">
                  <span>{pad(index + 1)}</span>
                  <span>{service.pillar}</span>
                </span>
                <span>
                  <span className="heading-s block">{service.name}</span>
                  <span className="para-m mt-[1.6rem] line-clamp-5 block opacity-70">{service.description}</span>
                  <ArrowChip direction="right" className="mt-[2rem] text-[2rem] transition-transform duration-500 group-hover:translate-x-[0.4rem]" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
