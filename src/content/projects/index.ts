import { airly } from "./airly";
import { andrewCallaghan } from "./andrew-callaghan";
import { barkerWellness } from "./barker-wellness";
import { dymatize } from "./dymatize";
import { sophieBrussaux } from "./sophie-brussaux";
import { thinkApollo } from "./think-apollo";
import type { Project } from "./types";

export type { Media, Project, ProjectBlock } from "./types";

/** Newest first, the order the old site used. */
export const projects: Project[] = [andrewCallaghan, barkerWellness, airly, sophieBrussaux, thinkApollo, dymatize];

export const getProject = (slug: string) => projects.find((project) => project.slug === slug);

/** The case after this one, wrapping around to the first. */
export function nextProject(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
}
