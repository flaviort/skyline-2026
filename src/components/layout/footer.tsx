"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import { useRef } from "react";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { Marquee } from "@/components/motion/marquee";
import { SpinningLogo } from "@/components/three/spinning-logo";
import { Heading } from "@/components/type/heading";
import { DrawLineLink } from "@/components/ui/draw-line-link";
import { Icon } from "@/components/ui/icon";
import { PillButton } from "@/components/ui/pill-button";
import { Readout } from "@/components/ui/readout";
import { banner } from "@/content/home";
import { cookieCopy } from "@/content/legal";
import { contact, footer, socials } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * The end of every page (parts 07 and 08): the call to action next to the
 * orange 3D mark you can spin, then the site map, contact details and
 * socials, and a band with where the crew works. As it scrolls in, its
 * content trails behind its frame, so the page seems to lift off it like a
 * curtain.
 */
export function Footer() {
  const lenis = useLenis();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-footer-panel]",
          { yPercent: -35 },
          { yPercent: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  const year = new Date().getFullYear();
  const toTop = () => (lenis ? lenis.scrollTo(0, { duration: 2 }) : window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <footer ref={root} data-theme="dark" data-nav-theme="dark" className="relative overflow-clip bg-void">
      <div data-footer-panel="" className="flex min-h-svh flex-col">
        <div className="px-page grid flex-1 grid-cols-12 items-center gap-(--grid-gap) pt-[10rem] max-md:pt-[8rem]">
          <div className="col-span-7 max-md:col-span-12">
            <Heading as="h2" size="xxl" lines={footer.cta.lines} weightHover reveal={{ split: "chars", scroll: true }} />
            <p className="para-l mt-[3rem] max-w-[34rem] text-mute">{footer.cta.line}</p>
            <PillButton href={footer.cta.button.href} label={footer.cta.button.label} tone="orange" size="l" className="mt-[3rem]" />
          </div>
          <SpinningLogo finish="orange" scrollBoost={1.4} className="col-span-5 aspect-square w-full max-md:col-span-12 max-md:mx-auto max-md:w-[70%]" />
        </div>

        <div className="px-page mt-[6rem] grid grid-cols-12 gap-(--grid-gap) border-t border-[color-mix(in_srgb,var(--color-ground)_14%,transparent)] pt-[3rem] pb-[3rem] max-md:gap-y-[3rem]">
          <nav aria-label="Footer" className="col-span-3 max-md:col-span-6">
            <p className="readout mb-[1.6rem]">Navigate</p>
            <ul className="grid gap-[0.9rem]">
              {footer.nav.map((link) => (
                <li key={link.href}>
                  <DrawLineLink href={link.href} label={link.label} variant="menu" />
                </li>
              ))}
            </ul>
          </nav>
          <div className="col-span-4 max-md:col-span-6">
            <p className="readout mb-[1.6rem]">Contact</p>
            <address className="para-m grid gap-[0.6rem] not-italic">
              <a href={`mailto:${contact.email}`} className="w-fit transition-colors hover:text-orange">
                {contact.email}
              </a>
              <a href={contact.phone.href} className="w-fit transition-colors hover:text-orange">
                {contact.phone.label}
              </a>
              <a href={contact.address.map} target="_blank" rel="noreferrer" className="mt-[0.6rem] w-fit text-mute transition-colors hover:text-orange">
                {contact.address.lines.join(", ")}
              </a>
            </address>
          </div>
          <div className="col-span-3 max-md:col-span-6">
            <p className="readout mb-[1.6rem]">Follow</p>
            <ul className="grid gap-[0.9rem]">
              {socials.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-[0.5em] text-[max(1rem,12px)] font-semibold uppercase">
                    {link.label}
                    <Icon name="arrow" direction="up" className="h-[0.7em] w-auto rotate-45 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 flex flex-col items-end justify-between max-md:col-span-6 max-md:items-start">
            <button
              type="button"
              onClick={toTop}
              className="group grid size-[6rem] min-h-11 min-w-11 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-ground)_40%,transparent)] transition-colors hover:border-orange hover:bg-orange hover:text-ink"
            >
              <span className="sr-only">Back to top</span>
              <Icon name="arrow" direction="up" className="h-[1.4rem] w-auto transition-transform duration-500 ease-(--ease-osmo) group-hover:-translate-y-[0.4rem]" />
            </button>
          </div>
        </div>

        <Marquee label={`Working from ${footer.bases.join(", ")}`} duration={24} className="border-t border-[color-mix(in_srgb,var(--color-ground)_14%,transparent)] py-[1.4rem]">
          {footer.bases.concat(footer.bases).map((base, index) => (
            <span key={index} className="readout flex items-center gap-[2.4rem] pr-[2.4rem] text-ground">
              {base}
              <span aria-hidden className="size-[0.6rem] bg-orange" />
            </span>
          ))}
        </Marquee>

        <div className="px-page flex flex-wrap items-center justify-between gap-[1rem] py-[1.6rem]">
          <div className="flex flex-wrap items-center gap-x-[2.4rem] gap-y-[0.8rem]">
            <p className="readout">
              © {year} {footer.legal}
            </p>
            <nav aria-label="Legal" className="readout flex flex-wrap gap-x-[2.4rem] gap-y-[0.8rem]">
              {footer.legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-orange">
                  {link.label}
                </Link>
              ))}
              <CookieSettingsButton label={cookieCopy.footerLink} className="readout uppercase" />
            </nav>
          </div>
          <Readout coordinates={banner.readout.coordinates} place={banner.readout.place} timeZone={banner.readout.timeZone} />
        </div>
      </div>
    </footer>
  );
}
