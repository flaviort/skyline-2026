"use client";

import { useId, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type AccordionProps = {
  items: { q: string; a: string }[];
  /** Opening one closes the others */
  closeSiblings?: boolean;
};

/**
 * Questions that open on click: the answer's height eases open, the plus
 * turns into a cross and the row lights orange. Keyboard and screen reader
 * friendly (buttons with aria-expanded; answers are regions).
 */
export function Accordion({ items, closeSiblings = true }: AccordionProps) {
  const root = useRef<HTMLUListElement>(null);
  const id = useId();
  const [open, setOpen] = useState<number[]>([]);
  // Answers are open in the HTML (readable without JavaScript) and fold away on mount.
  const mounted = useRef(false);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-answer]").forEach((panel, index) => {
        const shown = open.includes(index);
        if (mounted.current) gsap.to(panel, { height: shown ? "auto" : 0, duration: 0.6, ease: "osmo", overwrite: true });
        else gsap.set(panel, { height: shown ? "auto" : 0 });
      });
      mounted.current = true;
    },
    { scope: root, dependencies: [open] },
  );

  const toggle = (index: number) =>
    setOpen((current) => (current.includes(index) ? current.filter((item) => item !== index) : closeSiblings ? [index] : [...current, index]));

  return (
    <ul ref={root} className="border-t border-[color-mix(in_srgb,var(--color-ground)_18%,transparent)]">
      {items.map((item, index) => {
        const shown = open.includes(index);
        return (
          <li key={item.q} className="border-b border-[color-mix(in_srgb,var(--color-ground)_18%,transparent)]">
            <h3>
              <button
                type="button"
                id={`${id}-q${index}`}
                aria-expanded={shown}
                aria-controls={`${id}-a${index}`}
                onClick={() => toggle(index)}
                className={cn("group flex w-full items-center justify-between gap-[2rem] py-[2.4rem] text-left transition-colors hover:text-orange", shown && "text-orange")}
              >
                <span className="heading-xxs text-[max(var(--heading-xxs),18px)] leading-[1.15]">{item.q}</span>
                <span aria-hidden className="relative grid size-[3.2rem] shrink-0 place-items-center">
                  <span className="absolute h-[2px] w-[1.4rem] bg-current" />
                  <span className={cn("absolute h-[1.4rem] w-[2px] bg-current transition-transform duration-500 ease-(--ease-osmo)", shown && "rotate-90 scale-y-0")} />
                </span>
              </button>
            </h3>
            <div id={`${id}-a${index}`} role="region" aria-labelledby={`${id}-q${index}`} data-answer="" className="overflow-hidden">
              <p className="para-l max-w-[64rem] pb-[3rem] text-mute">{item.a}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
