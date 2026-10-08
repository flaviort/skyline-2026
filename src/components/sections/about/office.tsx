"use client";

import Image from "next/image";
import { useRef } from "react";
import { Section } from "@/components/layout/section";
import { aboutPage } from "@/content/pages";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** Each photo's place in the collage and how fast it drifts (negative rises faster than the page) */
const LAYOUT = [
  { className: "col-span-7 col-start-1 aspect-[3/2]", speed: -8 },
  { className: "col-span-4 col-start-9 mt-[18rem] aspect-[3/4]", speed: -22 },
  { className: "col-span-4 col-start-3 -mt-[6rem] aspect-[5/7]", speed: -14 },
];

/**
 * The office at 1529 Dragon St: the story on one side, the three photos
 * scattered at different depths, each drifting at its own speed and
 * opening from a narrow slit as it arrives.
 */
export function Office() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-photo]").forEach((photo, index) => {
          gsap.fromTo(photo, { yPercent: 0 }, { yPercent: LAYOUT[index].speed, ease: "none", scrollTrigger: { trigger: photo, start: "top bottom", end: "bottom top", scrub: true } });
          gsap.fromTo(
            photo.firstElementChild,
            { clipPath: "inset(45% 0% 45% 0%)", scale: 1.3 },
            { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.6, ease: "move", scrollTrigger: { trigger: photo, start: "top 85%", once: true } },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section ref={root} className="px-page pb-[10rem]">
      <div className="grid grid-cols-12 gap-(--grid-gap)">
        <div className="col-span-5 col-start-8 mb-[6rem] max-md:col-span-12 max-md:col-start-1">
          <p className="readout">{aboutPage.hq.label}</p>
          <p className="para-m mt-[0.8rem]">{aboutPage.hq.value}</p>
          <p className="para-l mt-[3rem] text-mute">{aboutPage.story}</p>
        </div>
        {aboutPage.photos.map((photo, index) => (
          <figure key={photo.src} data-photo="" className={cn("relative max-md:col-span-12 max-md:col-start-1 max-md:mt-0", LAYOUT[index].className)}>
            <div className="absolute inset-0 overflow-hidden">
              <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
            </div>
          </figure>
        ))}
      </div>
    </Section>
  );
}
