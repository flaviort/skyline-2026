"use client";

import { Fragment, useRef } from "react";
import { Section } from "@/components/layout/section";
import { Heading } from "@/components/type/heading";
import { PillButton } from "@/components/ui/pill-button";
import { LogoMark } from "@/components/ui/logo-mark";
import { testimonials } from "@/content/pages";
import { gsap, useGSAP } from "@/lib/gsap";

/** Where each card comes to rest on the pile: rotation and offset in rem */
const REST = [
  { rotate: -5, x: -3, y: 1 },
  { rotate: 4, x: 4, y: -2 },
  { rotate: -1.5, x: 0, y: 2 },
  { rotate: 6, x: -2, y: -1 },
];

/** **bold** in the copy becomes <strong>. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, index) => (index % 2 ? <strong key={index} className="font-semibold text-ink">{part}</strong> : <Fragment key={index}>{part}</Fragment>))}
    </>
  );
}

/**
 * Kind words as a pile of cards (after igniteagency.com): the section pins
 * behind its giant title and each card is thrown in from below, spinning,
 * to land on the pile at its own angle. The last card is an invitation.
 * Without the pin (phones, reduced motion) the cards simply stack.
 */
export function Testimonials() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-pile-card]");
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: stage.current, start: "top top", end: `+=${cards.length * 70}%`, pin: true, scrub: 0.8 },
        });
        cards.forEach((card, index) => {
          const rest = REST[index % REST.length];
          timeline.fromTo(
            card,
            { y: () => window.innerHeight * 1.1, x: 0, xPercent: index % 2 ? 40 : -40, rotate: rest.rotate * -4 + (index % 2 ? 30 : -30) },
            { y: `${rest.y}rem`, x: `${rest.x}rem`, xPercent: 0, rotate: rest.rotate, ease: "power3.out", duration: 1 },
            index * 0.9,
          );
        });
        // The title sinks back as the pile grows.
        timeline.to("[data-pile-title]", { scale: 0.86, opacity: 0.35, ease: "none", duration: cards.length * 0.9 }, 0);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const cards = testimonials.items.length + 1;

  return (
    <Section ref={root} theme="light" navTheme="light" id="kind-words" data-nova-cover="" className="overflow-clip">
      <div ref={stage} className="relative grid min-h-svh place-items-center px-page py-[10rem] max-md:block">
        <div data-pile-title="" className="pointer-events-none md:absolute md:inset-0 md:grid md:place-items-center">
          <Heading lines={testimonials.title} size="xxl" reveal={{ split: "chars", scroll: true }} className="text-center text-[min(var(--heading-xxl)*1.6,22vw)]" />
        </div>

        <ul className="relative w-full max-md:mt-[4rem] max-md:grid max-md:grid-cols-[minmax(0,1fr)] max-md:gap-[2rem] md:h-[42rem]">
          {testimonials.items.map((item, index) => (
            <li
              key={item.name}
              data-pile-card=""
              style={{ zIndex: index + 1 }}
              className="flex w-[44rem] max-w-full flex-col max-md:w-auto justify-between gap-[3rem] bg-paper p-[3.2rem] text-ink shadow-[0_2rem_6rem_-2rem_rgb(0_0_0/0.35)] md:absolute md:top-0 md:left-[calc(50%-22rem)] md:min-h-[38rem]"
            >
              <LogoMark className="h-[2.4rem] w-auto text-orange" />
              <blockquote className="para-l text-ink/75">
                &ldquo;
                <Rich text={item.quote} />
                &rdquo;
              </blockquote>
              <footer>
                <p className="font-semibold">{item.name}</p>
                <p className="readout mt-[0.6rem]">{item.role}</p>
              </footer>
            </li>
          ))}
          <li
            data-pile-card=""
            style={{ zIndex: cards }}
            className="flex w-[44rem] max-w-full flex-col max-md:w-auto justify-between gap-[3rem] bg-orange p-[3.2rem] text-ink shadow-[0_2rem_6rem_-2rem_rgb(0_0_0/0.35)] md:absolute md:top-0 md:left-[calc(50%-22rem)] md:min-h-[38rem]"
          >
            <p className="readout text-ink">Next on the pile</p>
            <p className="heading-s">{testimonials.invite.line}</p>
            <PillButton href={testimonials.invite.href} label={testimonials.invite.label} className="self-start" />
          </li>
        </ul>
      </div>
    </Section>
  );
}
