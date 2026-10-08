import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { LegalDocument } from "@/components/sections/legal/legal-document";
import { privacy } from "@/content/legal";

export const metadata: Metadata = pageMetadata({ title: "Privacy policy", description: "How The Skyline Agency handles your personal information, cookies and your privacy choices, in plain English.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <PageShell>
      <main>
        <JsonLd data={[webPageSchema("WebPage", { name: "Privacy policy", description: privacy.intro, path: "/privacy" }), breadcrumbSchema([{ name: "Privacy policy", path: "/privacy" }])]} />
        <LegalDocument document={privacy} />
      </main>
    </PageShell>
  );
}
