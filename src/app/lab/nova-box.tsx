"use client";

import dynamic from "next/dynamic";
import { TRICKS, type TrickName } from "@/components/three/nova-tricks";

const NovaStage = dynamic(() => import("@/components/three/nova-stage"), { ssr: false });

const LABELS: Record<TrickName, string> = {
  backflip: "Backflip",
  frontflip: "Frontflip",
  barrelRoll: "Barrel roll",
  spin: "Spin",
  stretch: "Stretch",
  lookAround: "Look around",
  wave: "Wave",
};

/** Nova inside a box, with a button per trick, for review in the lab. */
export function NovaBox() {
  const play = (trick: TrickName) => window.dispatchEvent(new CustomEvent("nova:trick", { detail: trick }));

  return (
    <div className="grid gap-4">
      <div className="relative h-[34rem] overflow-hidden outline outline-paper/15">
        <NovaStage mode="box" height={300} follow enterDelay={0.2} />
      </div>
      <div className="flex flex-wrap gap-2">
        {TRICKS.map((trick) => (
          <button
            key={trick}
            type="button"
            onClick={() => play(trick)}
            className="para-xs bg-paper px-3 py-2 font-medium uppercase text-ink"
          >
            {LABELS[trick]}
          </button>
        ))}
      </div>
    </div>
  );
}
