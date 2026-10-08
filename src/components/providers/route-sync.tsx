"use client";

import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { beginRouteChange } from "@/lib/page-ready";

/**
 * Keeps the page plumbing in step with client navigation: an internal link
 * click (or back and forward) starts a route change so the next page waits
 * for its transition cue, and each new page starts at the top with fresh
 * ScrollTrigger measurements.
 */
export function RouteSync() {
  const path = usePathname();
  const lenis = useLenis();
  const first = useRef(true);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      beginRouteChange();
    };
    const onPop = () => beginRouteChange();
    // Capture phase: before Next's Link starts the navigation.
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    lenis?.scrollTo(0, { immediate: true, force: true });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [path, lenis]);

  return null;
}
