"use client";

import { useRef, useState } from "react";
import { LaunchIntro } from "@/components/layout/launch-intro";
import { BlockReveal, blockReveal } from "@/components/motion/block-reveal";
import type { gsap } from "@/lib/gsap";

const button = "para-xs bg-paper px-3 py-2 font-medium uppercase text-ink";

/** Replays the launch intro over the lab with fake milestones; "slow" makes each one wait 1.8s, so the 5s cap kicks in. */
export function IntroLab() {
  const [run, setRun] = useState<{ id: number; slow: boolean } | null>(null);
  const play = (slow: boolean) => setRun({ id: Date.now(), slow });

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => play(false)} className={button}>
        Play
      </button>
      <button type="button" onClick={() => play(true)} className={button}>
        Play, slow network
      </button>
      {run && <LaunchIntro key={run.id} preview={{ slow: run.slow, onDone: () => setRun(null) }} />}
    </div>
  );
}

/** A headline line through the block reveal, with a replay button. */
export function BlockRevealLab() {
  const box = useRef<HTMLDivElement>(null);
  const current = useRef<gsap.core.Timeline | null>(null);
  const play = () => {
    const line = box.current?.querySelector<HTMLElement>("[data-block-reveal]");
    if (!line) return;
    current.current?.progress(1).kill();
    current.current = blockReveal(line);
  };

  return (
    <div ref={box} className="grid justify-items-start gap-6">
      <p className="text-[8.7rem] leading-none font-light tracking-[-0.045em]">
        <BlockReveal>We launch</BlockReveal>
      </p>
      <button type="button" onClick={play} className={button}>
        Replay
      </button>
    </div>
  );
}
