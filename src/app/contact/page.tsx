import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { Section } from "@/components/layout/section";
import { ContactForm } from "@/components/sections/contact/contact-form";
import { CopyEmail } from "@/components/sections/contact/copy-email";
import { PageHero } from "@/components/sections/shared/page-hero";
import { Readout } from "@/components/ui/readout";
import { banner } from "@/content/home";
import { contactPage } from "@/content/pages";
import { contact, socials } from "@/content/site";

export const metadata: Metadata = pageMetadata({ title: "Contact", description: "Start a project with The Skyline Agency in Dallas: email accounts@theskylineagency.com, call +1 972 861 0416 or visit 1529 Dragon St.", path: "/contact" });

export default function ContactPage() {
  return (
    <PageShell>
      <main>
        <JsonLd data={[webPageSchema("ContactPage", { name: "Contact The Skyline Agency", description: contactPage.intro, path: "/contact" }), breadcrumbSchema([{ name: "Contact", path: "/contact" }])]} />
        <PageHero eyebrow={contactPage.eyebrow} title={contactPage.title} intro={contactPage.intro}>
          <div className="mt-[8rem]">
            <CopyEmail email={contact.email} />
          </div>
        </PageHero>
        <Section className="px-page pb-[14rem]">
          <div className="grid grid-cols-12 gap-(--grid-gap) border-t border-[color-mix(in_srgb,var(--color-ground)_18%,transparent)] pt-[5rem] max-md:gap-y-[6rem]">
            <aside className="col-span-4 grid content-start gap-[4rem] max-lg:col-span-12">
              <div>
                <p className="readout">Call</p>
                <a href={contact.phone.href} className="heading-xs mt-[1rem] block hover:text-orange">
                  {contact.phone.label}
                </a>
              </div>
              <div>
                <p className="readout">Visit</p>
                <a href={contact.address.map} target="_blank" rel="noreferrer" className="para-l mt-[1rem] block hover:text-orange">
                  {contact.address.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </a>
                <Readout coordinates={banner.readout.coordinates} place={banner.readout.place} timeZone={banner.readout.timeZone} className="mt-[1.6rem]" />
              </div>
              <div>
                <p className="readout">Follow</p>
                <ul className="mt-[1rem] flex flex-wrap gap-x-[1.6rem] gap-y-[0.6rem]">
                  {socials.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noreferrer" className="text-[max(1.1rem,13px)] font-semibold uppercase hover:text-orange">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
            <div className="col-span-7 col-start-6 max-lg:col-span-12 max-lg:col-start-1">
              <ContactForm />
            </div>
          </div>
        </Section>
      </main>
    </PageShell>
  );
}
