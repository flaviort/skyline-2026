"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { banner } from "@/content/home";
import { useFinePointer, useReducedMotion } from "@/lib/hooks/use-media-query";
import { holdIntro } from "@/lib/intro";
import { clamp } from "@/lib/utils";

const NovaStage = dynamic(() => import("./nova-stage"), { ssr: false });

/** Space Nova keeps clear under the menu, in rem */
const TOP_CLEARANCE = 7;
/** Space he keeps clear above the intro line and Scroll button, in rem */
const BOTTOM_CLEARANCE = 13;
/** On wide screens he roams the right 56% of the width (widened from 26% on 2026-10-05, user) */
const WIDE_REGION: [number, number] = [0.42, 0.98];
/** Tablets: the headline is a little narrower relative to the screen */
const TABLET_REGION: [number, number] = [0.5, 0.98];

type NovaLayerProps = {
  /** Element whose scroll-out sends Nova away, also where the still pose sits */
  scrollOutSelector?: string;
  /** Element he lands on as the banner leaves (part 01b); without it he floats away */
  landingSelector?: string;
};

type Metrics = { height: number; insetTop: number; insetBottom: number; wide: boolean; region: [number, number] };

function readMetrics(): Metrics {
  const rootStyle = getComputedStyle(document.documentElement);
  const rootPx = parseFloat(rootStyle.fontSize) || 12;
  const rem = (name: string) => parseFloat(rootStyle.getPropertyValue(name)) * rootPx;
  // Started at about two headline lines (Q14); raised by about half after the first review.
  const height = clamp(rem("--heading-xxl") * 0.8 * 3.4, 210, 520);
  const wide = window.innerWidth >= 992;
  // From tablets up he keeps right of the headline; on phones the headline
  // fills the lower half, so he floats above it across the whole width.
  const sideBySide = window.innerWidth >= 768;
  return {
    height,
    insetTop: TOP_CLEARANCE * rootPx,
    insetBottom: sideBySide ? BOTTOM_CLEARANCE * rootPx : window.innerHeight * 0.5,
    wide,
    region: sideBySide ? (wide ? WIDE_REGION : TABLET_REGION) : [0, 1],
  };
}

let cached: { key: string; value: Metrics } | null = null;

function metricsSnapshot(): Metrics {
  const value = readMetrics();
  const key = JSON.stringify(value);
  if (!cached || cached.key !== key) cached = { key, value };
  return cached.value;
}

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange, { passive: true });
  return () => window.removeEventListener("resize", onChange);
}

/** How long Nova may take to appear before the still image takes his place, in ms */
const SHOW_TIMEOUT = 12000;

/**
 * What the 3D Nova needs, or why he cannot run here. three.js needs WebGL 2
 * (WebGL 1 is gone since r163), and the compressed model needs WebAssembly
 * to unpack (off in Edge's enhanced security mode, iOS Lockdown Mode and some
 * managed browsers).
 */
function missingSupport(): string | null {
  if (typeof WebAssembly !== "object") return "WebAssembly is not available";
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) return "WebGL 2 is not available";
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  } catch {
    return "WebGL 2 is not available";
  }
}

/**
 * Nova on the page: a fixed 3D layer that floats in after the headline,
 * wanders, follows the pointer and leaves on scroll (spec: part 01).
 * Loads while the launch intro is up (holding its countdown until the model
 * is ready, part 11a) and enters from the page cue, so it never delays the
 * text. Reduced motion, missing support, a failed scene or a model that
 * does not show up within SHOW_TIMEOUT all get the still pose instead.
 */
export function NovaLayer({ scrollOutSelector = "#banner", landingSelector }: NovaLayerProps) {
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const metrics = useSyncExternalStore(subscribeResize, metricsSnapshot, () => null);
  const [status, setStatus] = useState<"waiting" | "ready" | "shown" | "still">("waiting");
  const tag = useRef<HTMLDivElement>(null);
  // Holds the intro's countdown until he is ready to fly, or has fallen back.
  const release = useRef<() => void>(() => {});
  // Only the first reason is reported (switching to the still image itself
  // tears down the canvas, which loses its context).
  const fellBack = useRef(false);
  const fallBack = (reason: string) => {
    if (fellBack.current) return;
    fellBack.current = true;
    console.info(`[nova] showing the still image: ${reason}`);
    release.current();
    setStatus("still");
  };

  useEffect(() => {
    if (reducedMotion) return;
    release.current = holdIntro();
    let idle = 0;
    const start = () => {
      const missing = missingSupport();
      if (missing) fallBack(missing);
      else setStatus("ready");
    };
    if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 300 });
    else idle = window.setTimeout(start, 100);
    return () => {
      release.current();
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
    };
  }, [reducedMotion]);

  // A model that never appears (stalled download, silent failure) also falls back.
  useEffect(() => {
    if (status !== "ready") return;
    const timer = window.setTimeout(() => fallBack("the 3D model did not appear in time"), SHOW_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [status]);

  // The page sizes the landing spot from his height, and shows its own still
  // Nova there when the 3D one is not running.
  const still = reducedMotion || status === "still";
  useEffect(() => {
    if (!metrics) return;
    const root = document.documentElement;
    root.style.setProperty("--nova-h", `${metrics.height}px`);
    if (still) root.dataset.nova = "still";
    else delete root.dataset.nova;
  }, [metrics, still]);

  if (!metrics) return null;

  if (still) {
    return (
      <Image
        src="/images/legacy/nova.png"
        alt=""
        width={932}
        height={1289}
        className="pointer-events-none absolute right-[8vw] top-[28svh] w-auto"
        style={{ height: metrics.height }}
      />
    );
  }

  if (status === "waiting") return null;

  return (
    <>
      <NovaStage
        mode="page"
        scrollOutSelector={scrollOutSelector}
        landingSelector={landingSelector}
        height={metrics.height}
        insetTop={metrics.insetTop}
        insetBottom={metrics.insetBottom}
        follow={finePointer && metrics.wide}
        enterDelay={-0.15}
        region={metrics.region}
        tag={tag}
        onLoaded={() => release.current()}
        onShown={() => setStatus("shown")}
        onFail={fallBack}
      />
      {/* Telemetry tag that rides beside Nova; the stage moves it every frame. */}
      <div ref={tag} aria-hidden data-shown="0" className="nova-tag readout pointer-events-none fixed top-0 left-0 z-40">
        <span className="block text-ground">{banner.nova.name}</span>
        <span className="mt-[0.7rem] block">{banner.nova.status}</span>
      </div>
    </>
  );
}
