"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type PillButtonProps = {
  href: string;
  label: string;
  /** How many px the button grows on hover, width and height */
  grow?: [number, number];
  className?: string;
};

/**
 * Small boxed call to action (the menu's Contact button). On hover it grows
 * a few px, its dot spins out while new ones spin in, and the label rolls
 * up to a copy of itself. Styles live in globals.css (`.pill-button`).
 */
export function PillButton({ href, label, grow = [12, 6], className }: PillButtonProps) {
  const root = useRef<HTMLAnchorElement>(null);

  // Growth is a scale, so it needs the button's size: px in, scale factors out.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const { offsetWidth: width, offsetHeight: height } = element;
      if (!width || !height) return;
      element.style.setProperty("--grow-x", String((width + grow[0]) / width));
      element.style.setProperty("--grow-y", String((height + grow[1]) / height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [grow]);

  return (
    <Link ref={root} href={href} className={cn("pill-button", className)}>
      <span className="pill-button__dots" aria-hidden>
        <span className="pill-button__dot" />
        <span className="pill-button__dot pill-button__dot--in" style={{ "--i": 0 } as CSSProperties} />
        <span className="pill-button__dot pill-button__dot--in pill-button__dot--last" style={{ "--i": 1 } as CSSProperties} />
      </span>
      <span className="pill-button__label">
        <span className="pill-button__text">{label}</span>
        <span className="pill-button__text pill-button__text--next" aria-hidden>
          {label}
        </span>
      </span>
    </Link>
  );
}
