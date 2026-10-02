"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type ReadoutProps = {
  coordinates: string;
  place: string;
  /** IANA time zone for the live clock */
  timeZone: string;
  className?: string;
};

// One shared one-second clock for every subscriber.
const listeners = new Set<() => void>();
let timer = 0;
function subscribe(onTick: () => void) {
  listeners.add(onTick);
  if (!timer) timer = window.setInterval(() => listeners.forEach((listener) => listener()), 1000);
  return () => {
    listeners.delete(onTick);
    if (!listeners.size) {
      window.clearInterval(timer);
      timer = 0;
    }
  };
}
const now = () => Math.floor(Date.now() / 1000);

/**
 * The banner's ground-control line under the headline (part 01): the
 * studio's coordinates, its city and the live local time. All facts.
 */
export function Readout({ coordinates, place, timeZone, className }: ReadoutProps) {
  const seconds = useSyncExternalStore(subscribe, now, () => 0);
  const time = seconds
    ? new Date(seconds * 1000).toLocaleTimeString("en-US", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "--:--:--";

  return (
    <p className={cn("readout flex flex-wrap gap-x-[3.4rem] gap-y-[0.6rem] max-md:gap-x-[1.6rem]", className)}>
      <span className="max-md:hidden">{coordinates}</span>
      <span>{place}</span>
      <span>
        Local <time className="tabular-nums">{time}</time> CT
      </span>
    </p>
  );
}
