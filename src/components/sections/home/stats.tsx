"use client";

import Image from "next/image";
import { useRef } from "react";
import { Section } from "@/components/layout/section";
import { StatCard } from "@/components/ui/stat-card";
import { stats } from "@/content/home";
import { gsap, useGSAP } from "@/lib/gsap";

/** Seconds between one card opening and the next */
const STAGGER = 0.14;

/**
 * Part 01c: the first light section. It slides over the about section as that
 * one leaves (useScrollAway there). An office photo, then one paper card per
 * figure, four across on wide screens, two by two on tablets, stacked on phones.
 * When the row scrolls in, the cards open upward one after another (the photo
 * settles from a slight zoom inside its frame) and each number counts up as
 * its card opens. Everything is visible without JavaScript or with reduced motion.
 */
export function Stats() {
  const grid = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-stat-card]", grid.current);
        const timeline = gsap.timeline({ scrollTrigger: { trigger: grid.current, start: "top 80%", once: true } });
        cards.forEach((card, index) => {
          const at = index * STAGGER;
          timeline.fromTo(card, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "move" }, at);
          const number = card.querySelector<HTMLElement>("[data-count]");
          if (!number) {
            // The photo settles from a slight zoom inside its frame.
            timeline.from(card.querySelector("img"), { scale: 1.2, duration: 1.6, ease: "move" }, at);
            return;
          }
          // The content rises a little behind the opening edge, and the number counts up.
          timeline.from(card.children, { yPercent: 18, duration: 1.2, ease: "move" }, at);
          const count = { value: 0 };
          number.textContent = "0";
          timeline.to(count, { value: Number(number.dataset.count), duration: 1.6, ease: "move", onUpdate: () => void (number.textContent = String(Math.round(count.value))) }, at + 0.25);
        });
        // Back to the real figures if the animation is torn down part way.
        return () => gsap.utils.toArray<HTMLElement>("[data-count]", grid.current).forEach((number) => void (number.textContent = number.dataset.count ?? ""));
      });
      return () => media.revert();
    },
    { scope: grid },
  );

  return (
    <Section id="numbers" data-nova-cover="" theme="light" navTheme="light" aria-label={stats.label} className="px-page py-[16rem] max-md:py-[8rem]">
      <div ref={grid} className="grid grid-cols-4 gap-(--grid-gap) max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div data-stat-card="" className="relative aspect-[3/4] overflow-hidden max-sm:aspect-[4/5]">
          <Image src={stats.photo.src} alt={stats.photo.alt} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw" className="object-cover" />
        </div>
        {stats.items.map((item) => (
          <StatCard key={item.label} {...item} className="aspect-[3/4] max-sm:aspect-auto max-sm:min-h-[32rem]" />
        ))}
      </div>
    </Section>
  );
}
