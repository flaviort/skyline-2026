"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { contactCta, nav } from "@/content/site";
import { LogoMark } from "@/components/ui/logo-mark";
import { PillButton } from "@/components/ui/pill-button";
import { usePageEntrance } from "@/components/motion/use-page-entrance";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";
import { NavPill } from "./nav-pill";

/**
 * The fixed header on every page (part 09): the S mark (white, blended), the black
 * box of links in the center and the Contact button. Under 768px the box
 * and button give way to a toggle and a full-screen panel. It sits above
 * everything, Nova included. It drops in with the first page entrance (it
 * stays mounted across routes, so only after the launch intro).
 */
export function Menu() {
  const path = usePathname();
  // The panel remembers the page it was opened on, so a route change closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const toggle = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpenOn(null), []);

  usePageEntrance(
    (timeline) => {
      timeline.fromTo(
        "[data-menu-enter]",
        { autoAlpha: 0, yPercent: -60 },
        { autoAlpha: 1, yPercent: 0, duration: 0.8, stagger: 0.08 },
      );
    },
    { offset: -0.2 },
  );

  return (
    <>
      {/* The logo is its own fixed layer: white with a difference blend, so it
          inverts against whatever is under it (white on the dark ground, dark
          over light bands or Nova). Inside the header it could only blend
          with the header itself, which is empty. */}
      {/* Its own landmark: the logo sits outside the header so its blend can see the page. */}
      <nav aria-label="Home">
        <Link
          href="/"
          aria-label="The Skyline Agency, home"
          data-menu-enter
          style={{ viewTransitionName: "site-logo" }}
          className="fixed top-[1rem] left-(--page-padding) z-50 mt-[0.5rem] text-paper mix-blend-difference"
        >
          <LogoMark className="h-[3.5rem] w-auto" />
        </Link>
      </nav>

      <header data-menu-enter style={{ viewTransitionName: "site-header" }} className="pointer-events-none fixed inset-x-0 top-0 z-50 flex h-[5.35rem] items-start justify-between px-page pt-[1rem]">
        {/* Keeps the bar's layout: the logo itself is drawn above. */}
        <span aria-hidden className="h-[3.5rem] w-[3.9rem]" />

        <NavPill links={nav} current={path} className="pointer-events-auto absolute top-[1.67rem] left-1/2 hidden -translate-x-1/2 md:flex" />

        <PillButton href={contactCta.href} label={contactCta.label} className="pointer-events-auto mt-[0.7rem] hidden md:inline-flex" />

        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenOn(open ? null : path)}
          className="pointer-events-auto relative mt-[0.5rem] grid size-[3.5rem] place-items-center bg-black md:hidden"
        >
          <span
            aria-hidden
            className={cn(
              "absolute h-[2px] w-[1.5rem] bg-ground transition-transform duration-500 ease-(--ease-osmo)",
              open ? "rotate-45" : "-translate-y-[0.3rem]",
            )}
          />
          <span
            aria-hidden
            className={cn(
              "absolute h-[2px] w-[1.5rem] bg-ground transition-transform duration-500 ease-(--ease-osmo)",
              open ? "-rotate-45" : "translate-y-[0.3rem]",
            )}
          />
        </button>
      </header>

      <MobileMenu links={nav} contact={contactCta} current={path} open={open} onClose={close} toggle={toggle} />
    </>
  );
}
