import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { NextProject } from "@/components/sections/project/next-project";
import { ProjectBlocks } from "@/components/sections/project/project-blocks";
import { ProjectHero } from "@/components/sections/project/project-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { getProject, nextProject, projects } from "@/content/projects";
import { breadcrumbSchema, caseStudySchema, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  const cover = project.cover.type === "image" ? project.cover : { src: project.cover.poster, width: project.cover.width, height: project.cover.height };
  return pageMetadata({
    title: `${project.title}, ${project.subtitle}`,
    description: project.description,
    path: `/work/${project.slug}`,
    type: "article",
    image: { url: cover.src, width: cover.width, height: cover.height, alt: `${project.title}, ${project.subtitle}` },
  });
}

export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <PageShell>
      <main>
        <JsonLd data={[caseStudySchema(project), breadcrumbSchema([{ name: "Work", path: "/work" }, { name: project.title, path: `/work/${project.slug}` }])]} />
        <ProjectHero project={project} />
        <ProjectBlocks blocks={project.blocks} />
        <NextProject project={nextProject(slug)} />
      </main>
    </PageShell>
  );
}
