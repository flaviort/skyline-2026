import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/sections/shared/page-hero";
import { Accordion } from "@/components/ui/accordion";
import { faq, faqPage } from "@/content/faq";
import { pad } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({ title: "FAQ", description: "Answers about working with The Skyline Agency: services, websites, branding, marketing, SEO, pricing and timelines.", path: "/faq" });

export default function FaqPage() {
  return (
    <PageShell>
      <main>
        <JsonLd data={[faqSchema(faq.flatMap((group) => group.items)), breadcrumbSchema([{ name: "FAQ", path: "/faq" }])]} />
        <PageHero eyebrow={faqPage.eyebrow} title={faqPage.title} />
        <Section className="px-page grid gap-[8rem] pb-[14rem]">
          {faq.map((group, index) => (
            <Reveal key={group.title} className="grid grid-cols-12 gap-(--grid-gap)">
              <div className="col-span-4 max-md:col-span-12">
                <p className="readout">{pad(index + 1)}</p>
                <h2 className="heading-s mt-[1.2rem]">{group.title}</h2>
              </div>
              <div className="col-span-8 max-md:col-span-12">
                <Accordion items={group.items} />
              </div>
            </Reveal>
          ))}
        </Section>
      </main>
    </PageShell>
  );
}
