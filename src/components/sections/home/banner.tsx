import { Section } from "@/components/layout/section";
import { Heading } from "@/components/type/heading";
import { Lead } from "@/components/type/lead";
import { DrawLineLink } from "@/components/ui/draw-line-link";
import { banner } from "@/content/home";

/** Part 01: the first viewport. Nova floats over it from NovaLayer (page level). */
export function Banner() {
  return (
    <Section id="banner" className="h-svh min-h-[34rem]">
      <div className="px-page absolute inset-x-0 top-0 bottom-(--logo-band) flex flex-col items-center justify-center gap-[2rem] pt-[7rem] text-center">
        <Lead lines={banner.lead} />
        <Heading as="h1" size="xxl" lines={banner.headline} weightHover reveal={{ split: "chars", delay: 0.12 }} />
        <DrawLineLink href={banner.link.href} label={banner.link.label} chip="down" className="text-[1.75rem]" />
      </div>
      {/* Part 02 (client logos) fills this band. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-(--logo-band)" />
    </Section>
  );
}
