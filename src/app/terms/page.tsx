import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { LegalDocument } from "@/components/sections/legal/legal-document";
import { terms } from "@/content/legal";

export const metadata: Metadata = pageMetadata({ title: "Terms of use", description: "The terms for using theskylineagency.com, the website of The Skyline Agency in Dallas, TX.", path: "/terms" });

export default function TermsPage() {
  return (
    <PageShell>
      <main>
        <JsonLd data={[webPageSchema("WebPage", { name: "Terms of use", description: terms.intro, path: "/terms" }), breadcrumbSchema([{ name: "Terms of use", path: "/terms" }])]} />
        <LegalDocument document={terms} />
      </main>
    </PageShell>
  );
}
