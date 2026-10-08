import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { Office } from "@/components/sections/about/office";
import { ServicesStrip } from "@/components/sections/about/services-strip";
import { Stats } from "@/components/sections/home/stats";
import { PageHero } from "@/components/sections/shared/page-hero";
import { Statement } from "@/components/sections/shared/statement";
import { SpinningLogo } from "@/components/three/spinning-logo";
import { DrawLineLink } from "@/components/ui/draw-line-link";
import { aboutPage } from "@/content/pages";

export const metadata: Metadata = pageMetadata({ title: "About", description: aboutPage.intro, path: "/about" });

export default function AboutPage() {
  return (
    <PageShell>
      <main>
        <JsonLd data={[webPageSchema("AboutPage", { name: "About The Skyline Agency", description: aboutPage.intro, path: "/about" }), breadcrumbSchema([{ name: "About", path: "/about" }])]} />
        <PageHero
          eyebrow={aboutPage.eyebrow}
          title={aboutPage.title}
          intro={aboutPage.intro}
          aside={<SpinningLogo finish="paper" className="aspect-square w-[24rem] max-md:w-[16rem]" />}
        />
        <Office />
        <Statement text={aboutPage.statement} />
        <Stats />
        <Statement eyebrow="Good stewards" text={aboutPage.stewardship} theme="light" className="pt-0 [&_p]:text-(length:--heading-xs) [&_p]:leading-[1.15]" />
        <ServicesStrip />
        <div className="px-page flex justify-center py-[10rem]">
          <DrawLineLink href={aboutPage.deck.href} label={aboutPage.deck.label} chip="down" className="para-xl font-medium" />
        </div>
      </main>
    </PageShell>
  );
}
