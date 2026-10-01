"use client";

import { useLayoutEffect, type RefObject } from "react";

type FitOptions = {
  /** `word`: the longest word must fit (wrapping allowed). `line`: each `[data-line]` must fit on one line. */
  unit?: "word" | "line";
  /** Smallest scale allowed, as a fraction of the CSS size */
  min?: number;
  /** Share of the available width the text may use */
  room?: number;
};

/** Width of `text` set like `source` at `fontSize` px, measured off-screen. */
function measure(source: HTMLElement, text: string, fontSize: number) {
  const probe = source.cloneNode(false) as HTMLElement;
  probe.removeAttribute("data-line");
  // Lines whose weight grows on hover declare the weight to fit at.
  const fitWeight = source.getAttribute("data-fit-weight");
  if (fitWeight) probe.style.fontWeight = fitWeight;
  probe.textContent = text;
  Object.assign(probe.style, {
    position: "absolute",
    visibility: "hidden",
    whiteSpace: "nowrap",
    width: "max-content",
    left: "0",
    top: "0",
    fontSize: `${fontSize}px`,
  });
  source.parentElement?.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

/**
 * Shrinks a text element's font size only when its content would not fit
 * the space it sits in (the reference's heading fit). Never grows it past
 * the CSS size. Runs before the text is split, so reveals use the fitted size.
 */
export function useFitText<T extends HTMLElement>(ref: RefObject<T | null>, { unit = "word", min = 0.4, room = 0.96 }: FitOptions = {}) {
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;

    const fit = () => {
      el.style.removeProperty("font-size");
      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const style = getComputedStyle(box);
      const available = (box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) * room;
      if (!fontSize || available <= 0) return;

      const lines = Array.from(el.querySelectorAll<HTMLElement>("[data-line]"));
      const sources = lines.length ? lines : [el];
      let widest = 0;
      for (const source of sources) {
        const text = source.textContent?.trim() ?? "";
        const pieces = unit === "line" ? [text] : text.split(/\s+/);
        for (const piece of pieces) widest = Math.max(widest, measure(source, piece, fontSize));
      }
      if (widest > available) el.style.fontSize = `${fontSize * Math.max(min, available / widest)}px`;
    };

    fit();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fit, 120);
    };
    window.addEventListener("resize", onResize, { passive: true });
    document.fonts?.ready.then(fit);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
      el.style.removeProperty("font-size");
    };
  }, [ref, unit, min, room]);
}
