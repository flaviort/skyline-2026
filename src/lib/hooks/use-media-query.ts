"use client";

import { useSyncExternalStore } from "react";

function subscribeTo(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  };
}

/** Live media query match. Returns `serverValue` during SSR. */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    subscribeTo(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** Mouse or trackpad: hover-capable fine pointer. */
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");
