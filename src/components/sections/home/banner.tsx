import { Section } from "@/components/layout/section";
import { WordSwap } from "@/components/motion/word-swap";
import { Readout } from "@/components/ui/readout";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { banner } from "@/content/home";

const { headline, intro, readout, scroll } = banner;
const sentence = `${headline.line} ${headline.words.slice(0, -1).join(", ")} and ${headline.words.at(-1)}.`;

/**
 * Part 01: the first viewport, direction F (2026-10-02). A navy glow over the
 * site-wide stars (root layout), a left-aligned headline whose big word
 * launches through a list, the location and live time under it, and the intro
 * line with a rippling Scroll button. Nova floats on the right from NovaLayer.
 */
export function Banner() {
  return (
    <Section id="banner" className="h-svh min-h-[40rem] overflow-hidden">
      {/* A translucent glow, so the fixed stars still show through it. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_42%,color-mix(in_srgb,var(--color-space)_85%,transparent)_0%,transparent_60%)]"
      />

      <div className="px-page absolute inset-0 z-2 flex flex-col pt-[7rem] pb-[3.3rem] max-md:pt-[6.5rem] max-md:pb-[2.2rem]">
        <div className="flex flex-1 flex-col justify-center max-md:justify-end max-md:pb-[3rem]">
          <h1 className="tracking-[-0.045em]">
            <span className="sr-only">{sentence}</span>
            <span aria-hidden className="block text-[3.1rem] leading-none font-light md:text-[5.5rem] lg:text-[8.7rem]">
              {headline.line}
            </span>
            <WordSwap
              words={headline.words}
              delay={0.4}
              firstHold={5.5}
              className="text-[4.9rem] leading-[0.88] tracking-[-0.05em] md:text-[9rem] lg:text-[16.7rem]"
            />
          </h1>
          <Readout {...readout} className="mt-[1.4rem] max-md:mt-[1rem]" />
        </div>

        <div className="flex items-end justify-between gap-[1.6rem]">
          <p className="max-w-[35rem] text-[max(1.83rem,16px)] leading-[1.45] font-normal tracking-[-0.02em] text-balance max-md:max-w-[17rem]">
            {intro.plain} <strong className="font-bold">{intro.strong}</strong>
          </p>
          <ScrollCue href={scroll.href} label={scroll.label} className="shrink-0 max-md:size-[6.5rem]" />
        </div>
      </div>
    </Section>
  );
}
