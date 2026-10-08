"use client";

import { useRef, type CSSProperties } from "react";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { Media } from "@/components/ui/media";
import type { Media as MediaData, ProjectBlock } from "@/content/projects";
import { Draggable, gsap, InertiaPlugin, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

void InertiaPlugin;

/** Moves its media against the scroll inside a clipped frame. */
function Parallax({ media, className, amount = 12, sizes }: { media: MediaData; className?: string; amount?: number; sizes?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          root.current!.firstElementChild,
          { yPercent: -amount, scale: 1 + (amount * 2.2) / 100 },
          { yPercent: amount, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className={cn("relative overflow-hidden", className)} style={{ aspectRatio: `${media.width} / ${media.height}` }}>
      <div className="absolute inset-0">
        <Media media={media} fill sizes={sizes} />
      </div>
    </div>
  );
}

/** Rises into place and opens from a slightly smaller frame. */
function Feature({ block }: { block: Extract<ProjectBlock, { type: "feature" }> }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-feature-frame]",
          { clipPath: "inset(12% 10% 12% 10% round 2rem)", scale: 0.94 },
          { clipPath: "inset(0% 0% 0% 0% round 0rem)", scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  const banded = !!block.background;
  return (
    <div ref={root} style={{ "--band": block.background } as CSSProperties} className={cn("relative overflow-hidden", banded ? "bg-(--band) px-[8vw] py-[10vw]" : "px-page")}>
      {block.backdrop && (
        <div aria-hidden className="absolute inset-0 scale-110 opacity-60 blur-3xl">
          <Media media={block.media} fill sizes="40vw" />
        </div>
      )}
      <div data-feature-frame="" className="relative mx-auto max-w-[150rem] overflow-hidden">
        <Media media={block.media} sizes="(max-width: 767px) 100vw, 85vw" />
      </div>
    </div>
  );
}

/** Drag or throw the row; it settles with inertia inside its bounds. */
function Slider({ items }: { items: MediaData[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const [drag] = Draggable.create(track.current, {
        type: "x",
        bounds: root.current,
        inertia: true,
        edgeResistance: 0.85,
        dragClickables: true,
        onPress() {
          gsap.to(track.current!.children, { scale: 0.96, duration: 0.4, ease: "osmo" });
        },
        onRelease() {
          gsap.to(track.current!.children, { scale: 1, duration: 0.6, ease: "osmo" });
        },
      });
      return () => drag.kill();
    },
    { scope: root },
  );
  return (
    <div ref={root} className="overflow-hidden px-page">
      <p className="readout mb-[2rem]">Drag</p>
      <div ref={track} className="flex w-max cursor-grab gap-(--grid-gap) active:cursor-grabbing">
        {items.map((media, index) => (
          <div key={index} className="relative h-[60svh] shrink-0 overflow-hidden bg-[color-mix(in_srgb,var(--color-ground)_6%,transparent)] max-md:h-[40svh]" style={{ aspectRatio: `${media.width} / ${media.height}` }}>
            <Media media={media} fill sizes="60vw" className="pointer-events-none select-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The old site's expanding grid: six pieces around a center one. Pinned
 * for a screen: the center grows to fill the viewport while the six fall
 * away from it.
 */
function Mosaic({ block }: { block: Extract<ProjectBlock, { type: "mosaic" }> }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=120%", pin: true, scrub: 0.6 } });
        timeline.to("[data-mosaic-center]", { width: "100vw", height: "100svh", ease: "power2.inOut" }, 0);
        gsap.utils.toArray<HTMLElement>("[data-mosaic-around]").forEach((piece, index) => {
          const angle = (index / 6) * Math.PI * 2;
          timeline.to(piece, { x: Math.cos(angle) * 60 + "vw", y: Math.sin(angle) * 60 + "vh", rotate: (index % 2 ? 1 : -1) * 20, autoAlpha: 0, ease: "power2.in" }, 0);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  const slots = ["col-start-1 row-start-1", "col-start-2 row-start-1", "col-start-3 row-start-1", "col-start-1 row-start-3", "col-start-2 row-start-3", "col-start-3 row-start-3"];
  return (
    <div ref={root} className="relative grid h-svh place-items-center overflow-hidden max-md:h-auto max-md:py-[4rem]">
      <div className="grid h-full w-full grid-cols-3 grid-rows-[1fr_1.4fr_1fr] gap-[1.2rem] p-[1.2rem] max-md:grid-cols-2 max-md:grid-rows-none">
        {block.around.map((media, index) => (
          <div key={index} data-mosaic-around="" className={cn("relative overflow-hidden", slots[index], "max-md:col-auto max-md:row-auto max-md:aspect-square")}>
            <Media media={media} fill sizes="33vw" />
          </div>
        ))}
      </div>
      <div data-mosaic-center="" className="absolute h-[40%] w-[33%] overflow-hidden max-md:relative max-md:mx-page max-md:aspect-square max-md:h-auto max-md:w-auto">
        <Media media={block.center} fill sizes="100vw" />
      </div>
    </div>
  );
}

/** The case study's content, block by block, in the order the old site had it. */
export function ProjectBlocks({ blocks }: { blocks: ProjectBlock[] }) {
  return (
    <div className="grid gap-[12rem] pb-[12rem] max-md:gap-[6rem]">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "text":
            return (
              <Reveal key={index} className="px-page grid grid-cols-12 gap-(--grid-gap) gap-y-[2.4rem]">
                <p className="readout col-span-3 pt-[0.6rem] max-md:col-span-12">{block.label}</p>
                <div className="col-span-9 max-md:col-span-12">
                  {block.title && <h2 className="heading-s mb-[3rem] max-w-[24ch]">{block.title}</h2>}
                  <div className="grid max-w-[64rem] gap-[1.6rem] text-mute md:ml-[33%] [&_strong]:font-semibold [&_strong]:text-ground">
                    {block.body.map((paragraph, p) => (
                      <p key={p} className="para-l" dangerouslySetInnerHTML={{ __html: paragraph }} />
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          case "feature":
            return <Feature key={index} block={block} />;
          case "full":
            return <Parallax key={index} media={block.media} sizes="100vw" className="max-h-[120svh] w-full" />;
          case "grid":
            return (
              <div key={index} className="px-page grid grid-cols-3 items-start gap-(--grid-gap) max-md:grid-cols-1">
                {block.items.map((media, i) => (
                  <Parallax key={i} media={media} amount={8 + i * 4} sizes="(max-width: 767px) 100vw, 33vw" className={cn(i === 1 && "md:mt-[12rem]", i === 2 && "md:mt-[5rem]")} />
                ))}
              </div>
            );
          case "pair":
            return (
              <div key={index} className="grid grid-cols-2 max-md:grid-cols-1">
                {block.items.map((media, i) => (
                  <Parallax key={i} media={media} sizes="(max-width: 767px) 100vw, 50vw" className="h-[100svh] w-full max-md:h-auto" />
                ))}
              </div>
            );
          case "slider":
            return <Slider key={index} items={block.items} />;
          case "marquee":
            return (
              <div key={index} className="grid gap-(--grid-gap)">
                {block.rows.map((row, r) => (
                  <Marquee key={r} direction={r ? 1 : -1} duration={50}>
                    {row.map((media, m) => (
                      <div key={m} className="relative mr-(--grid-gap) h-[36svh] overflow-hidden max-md:h-[24svh]" style={{ aspectRatio: `${media.width} / ${media.height}` }}>
                        <Media media={media} fill sizes="50vw" />
                      </div>
                    ))}
                  </Marquee>
                ))}
              </div>
            );
          case "mosaic":
            return <Mosaic key={index} block={block} />;
        }
      })}
    </div>
  );
}
