import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, pageMetadata, servicesSchema, webPageSchema } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { PageHero } from "@/components/sections/shared/page-hero";
import { Testimonials } from "@/components/sections/shared/testimonials";
import { PillarList } from "@/components/sections/services/pillar-list";
import { SpinningLogo } from "@/components/three/spinning-logo";
import { services, servicesPage } from "@/content/services";

export const metadata: Metadata = pageMetadata({ title: "Services", description: "Digital strategy, branding, web development, user experience, digital marketing, SEO and media production from The Skyline Agency in Dallas, TX.", path: "/services" });

export default function ServicesPage() {
  return (
    <PageShell>
      <main>
        <JsonLd data={[webPageSchema("WebPage", { name: "Services", description: servicesPage.intro, path: "/services" }), servicesSchema(services), breadcrumbSchema([{ name: "Services", path: "/services" }])]} />
        <PageHero
          eyebrow={servicesPage.eyebrow}
          title={servicesPage.title}
          intro={servicesPage.intro}
          aside={<SpinningLogo finish="chrome" scrollBoost={2} className="aspect-square w-[26rem] max-md:w-[16rem]" />}
        />
        <PillarList />
        <Testimonials />
      </main>
    </PageShell>
  );
}
