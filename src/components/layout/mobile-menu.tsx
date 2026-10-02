"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import type { NavLink } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { isCurrent } from "./nav-pill";

type MobileMenuProps = {
  links: NavLink[];
  contact: NavLink;
  current: string;
  open: boolean;
  onClose: () => void;
  /** The toggle, which stays above the panel and is part of the focus loop */
  toggle: React.RefObject<HTMLButtonElement | null>;
};

/**
 * Full-screen menu under 768px (part 09, polished in part 10). The panel
 * slides down from the top, links rise in one after another; it closes on
 * the toggle, a link or Escape. Focus stays inside while open and scrolling
 * is paused. It covers Nova (his canvas is z-40) and sits under the bar (z-50).
 */
export function MobileMenu({ links, contact, current, open, onClose, toggle }: MobileMenuProps) {
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-menu-item]");
      timeline.current = gsap
        .timeline({ paused: true })
        .set(root.current, { visibility: "visible" })
        .fromTo("[data-menu-bg]", { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: "power3.inOut" }, 0)
        // Opacity, not autoAlpha: the links must stay focusable while they fade in.
        .fromTo(items, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.05 }, 0.25);
      timeline.current.eventCallback("onReverseComplete", () => void gsap.set(root.current, { visibility: "hidden" }));
    },
    { scope: root },
  );

  useEffect(() => {
    const tl = timeline.current;
    if (!tl) return;
    if (open) {
      // Visible before the first frame, so the first link can take focus.
      gsap.set(root.current, { visibility: "visible" });
      tl.timeScale(1).play();
      lenis?.stop();
      root.current?.querySelector<HTMLElement>("[data-menu-item] a")?.focus();
    } else {
      tl.timeScale(1.4).reverse();
      lenis?.start();
    }
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        toggle.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      // Keep focus between the panel's links and the toggle.
      const focusable = [toggle.current, ...Array.from(root.current?.querySelectorAll<HTMLElement>("a") ?? [])].filter(Boolean) as HTMLElement[];
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? index - 1 : index + 1;
      event.preventDefault();
      focusable[(next + focusable.length) % focusable.length]?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, toggle]);

  return (
    <div
      ref={root}
      id="mobile-menu"
      aria-hidden={!open}
      inert={!open}
      className="invisible fixed inset-0 z-[45] md:hidden"
    >
      <div data-menu-bg className="absolute inset-0 bg-black" />
      <nav aria-label="Main" className="px-page relative flex h-full flex-col justify-center gap-[1.5rem]">
        {[...links, contact].map((link) => (
          <div key={link.href} data-menu-item className="overflow-hidden">
            <Link
              href={link.href}
              onClick={onClose}
              aria-current={isCurrent(current, link.href) ? "page" : undefined}
              className="heading-l block text-ground aria-[current=page]:text-orange"
            >
              {link.label}
            </Link>
          </div>
        ))}
      </nav>
    </div>
  );
}
