import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { absolute } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; changeFrequency: "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "monthly" },
    { path: "/work", priority: 0.9, changeFrequency: "monthly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  ];
  return [
    ...pages.map((page) => ({ url: absolute(page.path), changeFrequency: page.changeFrequency, priority: page.priority })),
    ...projects.map((project) => ({
      url: absolute(`/work/${project.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
      images: project.cover.type === "image" ? [absolute(project.cover.src)] : [absolute(project.cover.poster)],
    })),
  ];
}
