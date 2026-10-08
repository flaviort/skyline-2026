import { ViewTransition } from "react";
import type { Project } from "@/content/projects";
import { Media } from "@/components/ui/media";
import { cn } from "@/lib/utils";

type ProjectCoverProps = {
  project: Project;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * A project's cover image, named for the View Transitions API: clicked on
 * a list or card, it flies into the hero of the case study (same name there).
 * Only one cover per project may be on a page at a time.
 */
export function ProjectCover({ project, sizes, priority, className }: ProjectCoverProps) {
  return (
    <ViewTransition name={`cover-${project.slug}`} share="cover" default="none">
      <div className={cn("relative overflow-hidden", className)}>
        <Media media={project.cover} alt={`${project.title}, ${project.subtitle}`} fill sizes={sizes} priority={priority} />
      </div>
    </ViewTransition>
  );
}
