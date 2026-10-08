import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Section } from "@/components/layout/section";
import { LostNova } from "@/components/sections/not-found/lost-nova";
import { Heading } from "@/components/type/heading";
import { PillButton } from "@/components/ui/pill-button";
import { notFoundPage } from "@/content/pages";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell footer={false}>
      <main>
        <Section className="px-page relative grid min-h-svh grid-cols-12 items-center gap-(--grid-gap) pt-[10rem] pb-[6rem]">
          <div className="col-span-7 max-md:col-span-12">
            <p className="readout">Error {notFoundPage.code} / Signal lost</p>
            <Heading as="h1" size="xxl" lines={notFoundPage.title} weightHover reveal={{ split: "chars", delay: 0.1 }} className="mt-[2.4rem]" />
            <p className="para-l mt-[3rem] max-w-[36rem] text-mute">{notFoundPage.line}</p>
            <PillButton href={notFoundPage.button.href} label={notFoundPage.button.label} tone="orange" size="l" className="mt-[3rem]" />
          </div>
          <div className="col-span-5 grid place-items-center max-md:col-span-12">
            <LostNova />
          </div>
        </Section>
      </main>
    </PageShell>
  );
}
