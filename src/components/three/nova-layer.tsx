"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { banner } from "@/content/home";
import { useFinePointer, useReducedMotion } from "@/lib/hooks/use-media-query";
import { whenPageReady } from "@/lib/page-ready";
import { clamp } from "@/lib/utils";

const NovaStage = dynamic(() => import("./nova-stage"), { ssr: false });

/** Space Nova keeps clear under the menu, in rem */
const TOP_CLEARANCE = 7;
/** Space he keeps clear above the intro line and Scroll button, in rem */
const BOTTOM_CLEARANCE = 13;
/** On wide screens he keeps to the right of the headline: fractions of the width */
const WIDE_REGION: [number, number] = [0.72, 0.98];
/** Tablets: the headline is a little narrower relative to the screen */
const TABLET_REGION: [number, number] = [0.66, 0.98];

type NovaLayerProps = {
  /** Element whose scroll-out sends Nova away, also where the still pose sits */
  scrollOutSelector?: string;
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

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Nova on the page: a fixed 3D layer that floats in after the headline,
 * wanders, follows the pointer and leaves on scroll (spec: part 01).
 * Loads after the page is ready and the browser is idle, so it never delays
 * the text. Reduced motion and missing WebGL get the still pose instead.
 */
export function NovaLayer({ scrollOutSelector = "#banner" }: NovaLayerProps) {
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const metrics = useSyncExternalStore(subscribeResize, metricsSnapshot, () => null);
  const [status, setStatus] = useState<"waiting" | "ready" | "no-webgl">("waiting");
  const tag = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let idle = 0;
    whenPageReady().then(() => {
      if (cancelled) return;
      const start = () => setStatus(hasWebGL() ? "ready" : "no-webgl");
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 1200 });
      else idle = window.setTimeout(start, 300);
    });
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
    };
  }, []);

  if (!metrics) return null;

  if (reducedMotion || status === "no-webgl") {
    return (
      <Image
        src="/images/legacy/nova.png"
        alt=""
        width={932}
        height={1289}
        className="pointer-events-none absolute right-[8vw] top-[28svh] w-auto"
        style={{ height: metrics.height }}
        priority={false}
      />
    );
  }

  if (status !== "ready") return null;

  return (
    <>
      <NovaStage
        mode="page"
        scrollOutSelector={scrollOutSelector}
        height={metrics.height}
        insetTop={metrics.insetTop}
        insetBottom={metrics.insetBottom}
        follow={finePointer && metrics.wide}
        enterDelay={0.9}
        region={metrics.region}
        tag={tag}
      />
      {/* Telemetry tag that rides beside Nova; the stage moves it every frame. */}
      <div ref={tag} aria-hidden data-shown="0" className="nova-tag readout pointer-events-none fixed top-0 left-0 z-40">
        <span className="text-ground">{banner.nova.name}</span>
        <br />
        {banner.nova.status}
      </div>
    </>
  );
}
