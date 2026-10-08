"use client";

import { useRef } from "react";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { Section } from "@/components/layout/section";
import { PageHero } from "@/components/sections/shared/page-hero";
import type { LegalDocument as LegalDocumentData } from "@/content/legal";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn, pad } from "@/lib/utils";

/**
 * A privacy policy or terms page: the giant title, a short human intro, then
 * the text in one readable column with a sticky table of contents that
 * tracks the section you're reading (an orange bar grows beside it).
 */
export function LegalDocument({ document: doc }: { document: LegalDocumentData }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const links = gsap.utils.toArray<HTMLElement>("[data-toc-link]");
      const sections = gsap.utils.toArray<HTMLElement>("[data-legal-section]");
      const activate = (index: number) => links.forEach((link, i) => link.toggleAttribute("data-active", i === index));
      sections.forEach((section, index) => {
        ScrollTrigger.create({ trigger: section, start: "top 45%", end: "bottom 45%", onToggle: (self) => self.isActive && activate(index) });
      });
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo("[data-toc-progress]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-legal-body]", start: "top 45%", end: "bottom 45%", scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <PageHero eyebrow={`${doc.eyebrow} / Updated ${doc.updated}`} title={doc.title} intro={doc.intro} />
      <Section className="px-page pb-[14rem]">
        <div className="grid grid-cols-12 gap-(--grid-gap) border-t border-[color-mix(in_srgb,var(--color-ground)_18%,transparent)] pt-[5rem]">
          <nav aria-label="On this page" className="col-span-3 max-lg:hidden">
            <div className="sticky top-[10rem] flex gap-[1.6rem]">
              <span aria-hidden className="relative w-px bg-[color-mix(in_srgb,var(--color-ground)_18%,transparent)]">
                <span data-toc-progress="" className="absolute inset-0 origin-top bg-orange" />
              </span>
              <ol className="grid gap-[0.2rem]">
                {doc.sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} data-toc-link="" className="readout flex min-h-[24px] items-center gap-[1rem] transition-colors hover:text-ground data-[active]:text-orange">
                      <span>{pad(index + 1)}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
          <div data-legal-body="" className="col-span-8 col-start-5 grid gap-[6rem] max-lg:col-span-12 max-lg:col-start-1">
            {doc.sections.map((section, index) => (
              <section key={section.id} id={section.id} data-legal-section="" className="scroll-mt-[10rem]">
                <p className="readout text-orange">{pad(index + 1)}</p>
                <h2 className="heading-xs mt-[1rem] text-[max(var(--heading-xs),22px)]">{section.title}</h2>
                <div className="legal-prose mt-[2rem]">
                  {section.blocks.map((block, b) =>
                    typeof block === "string" ? (
                      <p key={b}>{block}</p>
                    ) : "list" in block ? (
                      <ul key={b}>
                        {block.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div key={b} className="legal-prose__action">
                        <CookieSettingsButton
                          label={block.label}
                          className={cn("min-h-11 bg-orange px-[1.6rem] py-[1rem] text-[max(1rem,12px)] font-semibold text-ink uppercase hover:bg-ground hover:text-ink")}
                        />
                      </div>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
