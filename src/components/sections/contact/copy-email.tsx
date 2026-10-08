"use client";

import { useRef, useState } from "react";
import { contactPage } from "@/content/pages";
import { gsap } from "@/lib/gsap";

/**
 * The email address, huge. Clicking copies it (a mail link stays one tap
 * away underneath); the letters jump in a wave and a tag says it's copied.
 */
export function CopyEmail({ email }: { email: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      window.location.assign(`mailto:${email}`);
      return;
    }
    setCopied(true);
    gsap.fromTo(root.current?.querySelectorAll("[data-letter]") ?? [], { yPercent: 0 }, { yPercent: -35, duration: 0.25, ease: "power2.out", stagger: { each: 0.015, yoyo: true, repeat: 1 } });
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={copy} className="group block w-full text-left">
        <span className="sr-only">Copy {email}</span>
        <span aria-hidden className="block text-[min(5.4rem,6.4vw)] leading-none font-bold tracking-[-0.04em] break-all transition-colors group-hover:text-orange max-md:text-[7.4vw]">
          {[...email].map((letter, index) => (
            <span key={index} data-letter="" className="inline-block">
              {letter}
            </span>
          ))}
        </span>
      </button>
      <span role="status" className="readout mt-[1.4rem] flex items-center gap-[1rem]">
        <span className={copied ? "text-orange" : undefined}>{copied ? contactPage.copied : "Click to copy"}</span>
        <span aria-hidden>/</span>
        <a href={`mailto:${email}`} className="text-ground hover:text-orange">
          Open in mail
        </a>
      </span>
    </div>
  );
}
