"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ProjectCover } from "@/components/cards/project-cover";
import { Section } from "@/components/layout/section";
import { Media } from "@/components/ui/media";
import { projects } from "@/content/projects";
import { Flip, gsap, useGSAP } from "@/lib/gsap";
import { useFinePointer } from "@/lib/hooks/use-media-query";
import { cn, pad } from "@/lib/utils";

const ALL = "All";

/**
 * Every case as a big row: number, title, what it was, the services and
 * the year. With a mouse, the hovered case's cover follows the pointer,
 * leaning into the movement; it is the shared cover, so clicking flies it
 * into the case study's hero. Filters by service rearrange the rows with
 * Flip. On touch screens each row carries its own cover.
 */
export function WorkIndex() {
  const root = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const finePointer = useFinePointer();
  const [active, setActive] = useState<string | null>(null);
  const [filter, setFilter] = useState(ALL);
  const flipState = useRef<Flip.FlipState | null>(null);

  const filters = useMemo(() => [ALL, ...Array.from(new Set(projects.flatMap((project) => project.services))).sort()], []);
  const shown = (services: string[]) => filter === ALL || services.includes(filter);

  // The preview chases the pointer and leans with its speed.
  useGSAP(
    () => {
      if (!preview.current) return;
      gsap.set(preview.current, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
    },
    { scope: root },
  );

  const follow = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc; r: gsap.QuickToFunc; last: number } | null>(null);
  const onMove = (event: React.PointerEvent) => {
    if (!finePointer || !preview.current) return;
    follow.current ??= {
      x: gsap.quickTo(preview.current, "x", { duration: 0.6, ease: "power3" }),
      y: gsap.quickTo(preview.current, "y", { duration: 0.6, ease: "power3" }),
      r: gsap.quickTo(preview.current, "rotate", { duration: 0.8, ease: "power3" }),
      last: event.clientX,
    };
    const box = root.current!.getBoundingClientRect();
    follow.current.x(event.clientX - box.left);
    follow.current.y(event.clientY - box.top);
    follow.current.r(gsap.utils.clamp(-14, 14, (event.clientX - follow.current.last) * 0.6));
    follow.current.last = event.clientX;
  };

  const show = (slug: string | null) => {
    setActive(slug);
    if (!finePointer || !preview.current) return;
    gsap.to(preview.current, { scale: slug ? 1 : 0, autoAlpha: slug ? 1 : 0, duration: 0.6, ease: "osmo", overwrite: "auto" });
  };

  const pick = (value: string) => {
    flipState.current = Flip.getState("[data-work-row]");
    setFilter(value);
  };

  useGSAP(
    () => {
      if (!flipState.current) return;
      Flip.from(flipState.current, {
        duration: 0.8,
        ease: "osmo",
        stagger: 0.03,
        absolute: true,
        onEnter: (elements) => gsap.fromTo(elements, { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: "osmo" }),
        onLeave: (elements) => gsap.to(elements, { autoAlpha: 0, yPercent: -30, duration: 0.5, ease: "osmo" }),
      });
      flipState.current = null;
    },
    { scope: root, dependencies: [filter] },
  );

  const current = projects.find((project) => project.slug === active);

  return (
    <Section ref={root} id="index" className="px-page relative pb-[14rem]" onPointerMove={onMove}>
      <div role="group" aria-label="Filter by service" className="mb-[4rem] flex flex-wrap gap-[0.8rem]">
        {filters.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => pick(value)}
            className={cn(
              "readout min-h-11 border px-[1.4rem] py-[0.9rem] transition-colors duration-300",
              filter === value ? "border-orange bg-orange text-ink" : "border-[color-mix(in_srgb,var(--color-ground)_30%,transparent)] text-ground hover:border-orange",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <ul onPointerLeave={() => show(null)} className="border-t border-[color-mix(in_srgb,var(--color-ground)_18%,transparent)]">
        {projects.map((project, index) =>
          shown(project.services) ? (
            <li key={project.slug} data-work-row="" data-flip-id={project.slug}>
              <Link
                href={`/work/${project.slug}`}
                onPointerEnter={() => show(project.slug)}
                onFocus={() => show(project.slug)}
                onBlur={() => show(null)}
                className={cn(
                  "group grid grid-cols-12 items-center gap-(--grid-gap) border-b border-[color-mix(in_srgb,var(--color-ground)_18%,transparent)] py-[3.2rem] transition-opacity duration-500",
                  active && active !== project.slug && "md:opacity-30",
                )}
              >
                <span className="readout col-span-1 max-md:col-span-2">{pad(index + 1)}</span>
                <span className="heading-l col-span-6 font-bold transition-transform duration-700 ease-(--ease-osmo) group-hover:translate-x-[2rem] max-md:col-span-10">
                  {project.title}
                </span>
                <span className="para-m col-span-3 text-mute max-md:col-span-8 max-md:col-start-3">{project.subtitle}</span>
                <span className="readout col-span-2 text-right max-md:col-span-2">{project.year}</span>
                {!finePointer && (
                  <span className="relative col-span-12 mt-[1.6rem] block aspect-[4/3] overflow-hidden">
                    <Media media={project.cover} fill sizes="100vw" />
                  </span>
                )}
              </Link>
            </li>
          ) : null,
        )}
      </ul>

      {finePointer && (
        <div ref={preview} aria-hidden className="pointer-events-none absolute top-0 left-0 z-10 w-[30rem]">
          {current && <ProjectCover key={current.slug} project={current} sizes="30rem" className="aspect-[4/5] w-full" />}
          {current && (
            <ul className="mt-[0.8rem] flex flex-wrap gap-[0.4rem]">
              {current.services.map((service) => (
                <li key={service} className="readout bg-orange px-[0.6rem] py-[0.4rem] text-ink">
                  {service}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}
