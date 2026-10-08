import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { projects } from "@/content/projects";
import { breadcrumbSchema, pageMetadata, webPageSchema, workListSchema } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { PageHero } from "@/components/sections/shared/page-hero";
import { WorkIndex } from "@/components/sections/work/work-index";
import { Badge } from "@/components/ui/badge";
import { workPage } from "@/content/pages";

export const metadata: Metadata = pageMetadata({ title: "Work", description: "Case studies from The Skyline Agency in Dallas: websites, 3D, photography, social and campaigns for Dymatize, Airly, Barker Wellness, Think Apollo and more.", path: "/work" });

export default function WorkPage() {
  return (
    <PageShell>
      <main>
        <JsonLd data={[webPageSchema("CollectionPage", { name: "Work", description: workPage.intro, path: "/work" }), workListSchema(projects), breadcrumbSchema([{ name: "Work", path: "/work" }])]} />
        <PageHero eyebrow={workPage.eyebrow} title={workPage.title} intro={workPage.intro} aside={<Badge text="Six missions and counting" className="w-[15rem]" />} />
        <WorkIndex />
      </main>
    </PageShell>
  );
}
