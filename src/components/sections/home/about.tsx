"use client";

import Image from "next/image";
import { useRef } from "react";
import { Section } from "@/components/layout/section";
import { useScrollAway } from "@/components/motion/use-scroll-away";
import { useScrollLight } from "@/components/motion/use-scroll-light";
import { Eyebrow } from "@/components/type/eyebrow";
import { DrawLineLink } from "@/components/ui/draw-line-link";
import { about } from "@/content/home";

/** How far Nova stands above the centre of his line, in his landed heights (the still image matches: 0.3) */
const NOVA_LIFT = 0.3;

/**
 * Part 01b: one big left-aligned statement across the width (round 3, layout
 * A). Nova frontflips out of the banner and lands in a gap inside the
 * sentence: the spot (NOVA_LANDING in src/lib/nova-landing.ts) is one line
 * tall, so the lines keep an even rhythm, and he is taller than the line. The
 * section sits above his canvas (z 41 over 40), so the lines above and below
 * pass in front of him: he stands among the words. The words light up as the
 * statement scrolls through; as the section leaves, the light section after
 * it slides over (useScrollAway). Without the 3D Nova the spot shows his still
 * image at the same size.
 */
export function About() {
  const content = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLParagraphElement>(null);
  useScrollAway(content);
  useScrollLight(text);

  return (
    <Section id="about" className="px-page relative z-[41] flex min-h-svh flex-col justify-center overflow-clip pt-[8rem] pb-[14rem]">
      <div ref={content}>
        <Eyebrow>{about.eyebrow}</Eyebrow>
        <h2 className="sr-only">{about.eyebrow}</h2>
        <p ref={text} className="mt-[3.2rem] text-(length:--heading-m) leading-[1.02] font-medium tracking-[-0.045em] max-md:text-(length:--heading-s)">
          {about.statement.before}{" "}
          {/* One line tall. He is drawn at LANDING_SIZE of his height and lifted by
              NOVA_LIFT of it, so he stands on this line with his boots just behind the next. */}
          <span
            data-nova-landing
            data-nova-lift={NOVA_LIFT}
            aria-hidden
            className="relative mx-[0.1em] inline-block h-[1em] w-[calc(var(--nova-h,30rem)*0.45)] align-middle"
          >
            <Image
              src="/images/legacy/nova.png"
              alt=""
              width={932}
              height={1289}
              className="nova-still absolute top-1/2 left-1/2 h-[calc(var(--nova-h,30rem)*0.6)] w-auto max-w-none -translate-x-1/2 translate-y-[calc(-50%-var(--nova-h,30rem)*0.6*0.3)]"
            />
          </span>{" "}
          {about.statement.after}
        </p>
        <div className="mt-[5rem] flex justify-end">
          <DrawLineLink href={about.link.href} label={about.link.label} className="para-xl font-medium" />
        </div>
      </div>
    </Section>
  );
}
