"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/hooks/use-media-query";
import { whenPageReady } from "@/lib/page-ready";
import { clamp } from "@/lib/utils";

const NovaStage = dynamic(() => import("./nova-stage"), { ssr: false });

/** Menu height plus a little air, in px (part 09 owns the real menu) */
const MENU_CLEARANCE = 72;

type NovaLayerProps = {
  /** Element whose scroll-out sends Nova away, also where the still pose sits */
  scrollOutSelector?: string;
};

type Metrics = { height: number; insetTop: number; insetBottom: number; wide: boolean };

function readMetrics(): Metrics {
  const rootStyle = getComputedStyle(document.documentElement);
  const rootPx = parseFloat(rootStyle.fontSize) || 12;
  const rem = (name: string) => parseFloat(rootStyle.getPropertyValue(name)) * rootPx;
  // Started at about two headline lines (Q14); raised by about half after the first review.
  const height = clamp(rem("--heading-xxl") * 0.8 * 3.4, 210, 520);
  return { height, insetTop: MENU_CLEARANCE, insetBottom: rem("--logo-band"), wide: window.innerWidth >= 992 };
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
    <NovaStage
      mode="page"
      scrollOutSelector={scrollOutSelector}
      height={metrics.height}
      insetTop={metrics.insetTop}
      insetBottom={metrics.insetBottom}
      follow={finePointer && metrics.wide}
      enterDelay={0.9}
    />
  );
}
