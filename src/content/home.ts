import type { HeadingLine } from "@/components/type/heading";

// Homepage copy (approved in docs/CONTENT.md). Edit words here, not in components.

export const banner = {
  lead: ["Strategy, brands and websites", "made in Dallas, TX"],
  headline: [{ text: "We grow" }, { text: "brands" }, { text: "astronomically", accent: true }] satisfies HeadingLine[],
  link: { label: "Discover more", href: "#agency" },
};
