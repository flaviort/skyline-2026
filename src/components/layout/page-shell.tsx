"use client";

import { useEffect, ViewTransition, type ReactNode } from "react";
import { endRouteChange, inRouteChange } from "@/lib/page-ready";
import { Footer } from "./footer";

/** Seconds from the start of the sweep until the new page has covered the screen (matches `page-in` in globals.css) */
const SWEEP_CLEAR = 0.55;

/**
 * React hides the root snapshot (with a zero-length opacity animation on
 * ::view-transition-group(root)) when only named boundaries change. Here the
 * root snapshot is the old screen we want to shrink, so that hide is undone.
 */
function revealRoot() {
  const cancel = () =>
    document.getAnimations().forEach((animation) => {
      const effect = animation.effect as KeyframeEffect | null;
      if (effect?.pseudoElement === "::view-transition-group(root)" && !(animation instanceof CSSAnimation)) animation.cancel();
    });
  cancel();
  requestAnimationFrame(cancel);
}

type PageShellProps = {
  children: ReactNode;
  /** The footer with its call to action closes every page; the 404 page leaves it out */
  footer?: boolean;
};

/**
 * Every page sits in one of these. On a route change the browser's View
 * Transitions API (through React's ViewTransition) plays the launch: the old
 * page shrinks back into an orange field while the new one sweeps up from
 * the bottom (styles under "Route transitions" in globals.css). The new
 * page's entrances start from the sweep. Without View Transitions support the
 * new page simply shows and its entrances play straight away.
 */
export function PageShell({ children, footer = true }: PageShellProps) {
  useEffect(() => {
    if (!inRouteChange()) return;
    const sweeps = typeof document.startViewTransition === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    // onEnter below fires the cue when the sweep starts; this is the fallback.
    const timer = window.setTimeout(() => endRouteChange(), sweeps ? 1200 : 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ViewTransition enter="page-in" exit="none" default="none" onEnter={() => {
        revealRoot();
        endRouteChange({ clearIn: SWEEP_CLEAR });
      }}>
      <div className="page-shell relative">
        {children}
        {footer && <Footer />}
      </div>
    </ViewTransition>
  );
}
