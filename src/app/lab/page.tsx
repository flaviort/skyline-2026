import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Section } from "@/components/layout/section";
import { Heading } from "@/components/type/heading";
import { Lead } from "@/components/type/lead";
import { ArrowChip, type ChipColor } from "@/components/ui/arrow-chip";
import { DrawLineLink } from "@/components/ui/draw-line-link";
import { Icon, type Direction } from "@/components/ui/icon";
import { NavPill } from "@/components/layout/nav-pill";
import { PillButton } from "@/components/ui/pill-button";
import { nav } from "@/content/site";
import { NovaBox } from "./nova-box";

export const metadata: Metadata = { title: "Component lab", robots: { index: false, follow: false } };

const COLORS: ChipColor[] = ["orange", "ink", "paper", "cobalt", "lilac", "visor"];
const DIRECTIONS: Direction[] = ["right", "down", "left", "up"];

function Entry({ name, note, children }: { name: string; note?: string; children: ReactNode }) {
  return (
    <div className="grid gap-6 border-t border-(--theme-border)/15 py-12">
      <div className="flex items-baseline gap-4">
        <h2 className="heading-xxs">{name}</h2>
        {note && <p className="para-s text-mute">{note}</p>}
      </div>
      {children}
    </div>
  );
}

/** Development-only page that shows every library component on its own. */
export default function LabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="px-page pb-24">
      <header className="py-16">
        <p className="para-s text-mute">Development only</p>
        <h1 className="heading-l">Component lab</h1>
      </header>

      <Entry name="Heading" note="Bold lines with a thin accent line, char reveal, cursor weight (move the mouse over it)">
        <Heading
          as="h2"
          size="xxl"
          weightHover
          lines={[{ text: "We grow" }, { text: "brands" }, { text: "astronomically", accent: true }]}
        />
        <Heading as="h3" size="xl" lines={[{ text: "Recent" }, { text: "work", accent: true }]} />
        <Heading as="h3" size="m" reveal={false} lines={[{ text: "Static, no reveal" }]} />
      </Entry>

      <Entry name="Lead" note="Two lines above a headline, line reveal">
        <Lead lines={["Strategy, brands and websites", "made in Dallas, TX"]} />
      </Entry>

      <Entry name="NavPill" note="The menu's black box of links; the current page keeps its squiggle (here: Work)">
        <div>
          <NavPill links={nav} current="/work" className="inline-flex" />
        </div>
      </Entry>

      <Entry name="PillButton" note="Hover: grows, dots spin, label rolls">
        <div>
          <PillButton href="#nova" label="Contact" />
        </div>
      </Entry>

      <Entry name="DrawLineLink" note="Hover: a new squiggle draws each time">
        <div className="flex flex-wrap items-center gap-12 text-[1.75rem]">
          <DrawLineLink href="#nova" label="Discover more" chip="down" />
          <DrawLineLink href="#nova" label="See all work" color="cobalt" />
          <DrawLineLink href="#nova" label="Current page" persist chip={false} />
        </div>
      </Entry>

      <Entry name="ArrowChip" note="Colors and directions; ink on orange (Q17)">
        <div className="flex flex-wrap gap-4 text-[2.5rem]">
          {COLORS.map((color) => (
            <ArrowChip key={color} color={color} />
          ))}
        </div>
        <div className="flex gap-4 text-[2.5rem]">
          {DIRECTIONS.map((direction) => (
            <ArrowChip key={direction} direction={direction} />
          ))}
        </div>
      </Entry>

      <Entry name="Icon" note="Legacy SVGs, no library (Q20)">
        <div className="flex items-center gap-8 text-[2rem]">
          <Icon name="arrow" className="h-[1em] w-auto" title="Arrow" />
          <Icon name="angle" className="h-[0.6em] w-auto" title="Angle" />
          <Icon name="close" className="h-[1em] w-auto" title="Close" />
          <Icon name="diagonal" className="h-[1em] w-auto" title="Diagonal arrow" />
        </div>
      </Entry>

      <Entry name="Section" note="Dark (site default) and light themes">
        <div className="grid grid-cols-2">
          <Section className="p-8 outline outline-paper/20">
            <p className="heading-s">Dark</p>
          </Section>
          <Section theme="light" className="p-8">
            <p className="heading-s">Light</p>
          </Section>
        </div>
      </Entry>

      <Entry name="Nova" note="Move the mouse in the box; leave it still for idle tricks, or play one">
        <div id="nova">
          <NovaBox />
        </div>
      </Entry>
    </main>
  );
}
