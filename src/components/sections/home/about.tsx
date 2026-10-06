"use client";

import Image from "next/image";
import { useRef } from "react";
import { Section } from "@/components/layout/section";
import { useKineticText } from "@/components/motion/use-kinetic-text";
import { Eyebrow } from "@/components/type/eyebrow";
import { Heading } from "@/components/type/heading";
import { PillButton } from "@/components/ui/pill-button";
import { about } from "@/content/home";

/**
 * Part 01b: the old site's About block, centered. Nova frontflips out of the
 * banner and lands on the empty spot above the heading (the stage finds it
 * by NOVA_LANDING in src/lib/nova-landing.ts); the spot's parent is the block that ends up centered on
 * screen when he lands. Without the 3D Nova the spot shows his still image.
 */
export function About() {
  const body = useRef<HTMLParagraphElement>(null);
  useKineticText(body, { reveal: { split: "lines", scroll: true, delay: 0.15 } });

  return (
    <Section id="about" className="px-page flex min-h-svh flex-col items-center justify-center pt-[8rem] pb-[14rem] text-center">
      <div className="flex w-full flex-col items-center">
        {/* Sized from his landed height (LANDING_SIZE) plus room for his float. */}
        <div data-nova-landing aria-hidden className="relative h-[calc(var(--nova-h,30rem)*0.6*1.1)] w-[calc(var(--nova-h,30rem)*0.45)]">
          <Image
            src="/images/legacy/nova.png"
            alt=""
            width={932}
            height={1289}
            className="nova-still absolute inset-x-0 bottom-[4%] mx-auto h-[92%] w-auto"
          />
        </div>
        <Eyebrow className="mt-[1rem]">{about.eyebrow}</Eyebrow>
        <Heading as="h2" size="xxl" weightHover reveal={{ split: "chars", scroll: true }} lines={[{ text: about.heading }]} className="mt-[1.2rem]" />
        <p
          ref={body}
          data-reveal=""
          className="mt-[2.4rem] max-w-[65rem] text-[max(2.5rem,20px)] leading-[1.3] font-normal tracking-[-0.03em] text-balance"
        >
          {about.body.before} <strong className="font-bold">{about.body.strong}</strong>
          {about.body.after}
        </p>
        <PillButton href={about.button.href} label={about.button.label} tone="orange" size="l" className="mt-[3.6rem]" />
      </div>
    </Section>
  );
}
