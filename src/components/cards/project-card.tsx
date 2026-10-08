import Link from "next/link";
import type { CSSProperties } from "react";
import type { Project } from "@/content/projects";
import { ArrowChip } from "@/components/ui/arrow-chip";
import { cn, pad, prefersInk } from "@/lib/utils";
import { ProjectCover } from "./project-cover";

type ProjectCardProps = {
  project: Project;
  index: number;
  total: number;
  className?: string;
};

/**
 * A case study on its own brand color: index, title and services on the
 * left, the cover on the right. The whole card is the link.
 */
export function ProjectCard({ project, index, total, className }: ProjectCardProps) {
  const ink = prefersInk(project.color);
  return (
    <Link
      href={`/work/${project.slug}`}
      style={{ "--card": project.color } as CSSProperties}
      className={cn(
        "group grid h-full grid-cols-12 gap-(--grid-gap) overflow-hidden bg-(--card) p-[2.4rem] max-md:grid-rows-[auto_1fr] max-md:p-[1.6rem]",
        ink ? "text-ink" : "text-paper",
        className,
      )}
    >
      <div className="col-span-5 flex flex-col justify-between max-md:col-span-12 max-md:gap-[2rem]">
        <div className="readout flex justify-between text-current opacity-70">
          <span>
            {pad(index + 1)} / {pad(total)}
          </span>
          <span>{project.year}</span>
        </div>
        <div>
          <h3 className="heading-l font-bold">{project.title}</h3>
          <p className="para-l mt-[1.2rem] opacity-80">{project.subtitle}</p>
          <ul className="mt-[2.4rem] flex flex-wrap gap-[0.6rem]">
            {project.services.map((service) => (
              <li key={service} className="readout border border-current px-[0.8rem] py-[0.55rem] text-current">
                {service}
              </li>
            ))}
          </ul>
          <span className="mt-[3rem] inline-flex items-center gap-[0.6rem] text-[max(1.2rem,13px)] font-semibold uppercase">
            View the case
            <ArrowChip color={ink ? "ink" : "orange"} direction="right" className="transition-transform duration-500 ease-(--ease-osmo) group-hover:translate-x-[0.4rem]" />
          </span>
        </div>
      </div>
      <ProjectCover
        project={project}
        sizes="(max-width: 767px) 100vw, 60vw"
        className="col-span-7 h-full min-h-[24rem] max-md:col-span-12 [&_img]:transition-transform [&_img]:duration-[1.2s] [&_img]:ease-(--ease-osmo) group-hover:[&_img]:scale-[1.05]"
      />
    </Link>
  );
}
