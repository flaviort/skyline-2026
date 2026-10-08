import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { About } from "@/components/sections/home/about";
import { Banner } from "@/components/sections/home/banner";
import { Clients } from "@/components/sections/home/clients";
import { Stats } from "@/components/sections/home/stats";
import { WhatWeDo } from "@/components/sections/home/what-we-do";
import { WorkStack } from "@/components/sections/home/work-stack";
import { Testimonials } from "@/components/sections/shared/testimonials";
import { NovaLayer } from "@/components/three/nova-layer";
import { NOVA_LANDING } from "@/lib/nova-landing";
import { pageMetadata, SITE } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ description: SITE.description, path: "/" });

export default function Home() {
  return (
    <PageShell>
      <main className="relative">
        <Banner />
        {/* Scroll room for the space journey: Nova and the cast play on the fixed canvas above it. */}
        <div id="journey" aria-hidden className="space-journey" />
        <About />
        {/* Light from here on: it slides over the about section. */}
        <Stats />
        <Clients />
        <WorkStack />
        <WhatWeDo />
        <Testimonials />
        <NovaLayer landingSelector={NOVA_LANDING} />
      </main>
    </PageShell>
  );
}
