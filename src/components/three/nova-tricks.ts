import { gsap } from "@/lib/gsap";

// Procedural idle tricks. Each trick animates a small state object that the
// render loop reads; when the 3D designer delivers clips with the same names,
// they take over. Rotations are in turns (1 = 360deg).

export type TrickState = {
  /** Somersault around Nova's left-right axis */
  flip: number;
  /** Cartwheel in the screen plane */
  roll: number;
  /** Turn around the vertical axis */
  spin: number;
  /** Upward hop during a trick, in Nova heights */
  lift: number;
  /** Arms raised, 0 to 1 */
  armL: number;
  armR: number;
  /** Strength of the hand wave, 0 to 1 (the swing itself runs on a clock) */
  wave: number;
  /** Looking left (-1) to right (1) */
  look: number;
  /** Knees and arms pulled in, 0 to 1 (flips and rolls) */
  tuck: number;
};

export const emptyTrickState = (): TrickState => ({
  flip: 0,
  roll: 0,
  spin: 0,
  lift: 0,
  armL: 0,
  armR: 0,
  wave: 0,
  look: 0,
  tuck: 0,
});

export const TRICKS = ["backflip", "frontflip", "barrelRoll", "spin", "stretch", "lookAround", "wave"] as const;
export type TrickName = (typeof TRICKS)[number];

const ROTATIONS = ["flip", "roll", "spin"] as const;

function rotation(s: TrickState, key: (typeof ROTATIONS)[number], turns: number, duration: number) {
  return gsap
    .timeline({ onComplete: () => void (s[key] = 0) })
    .to(s, { [key]: turns, duration, ease: "power2.inOut" }, 0)
    .to(s, { lift: 0.35, duration: duration / 2, ease: "sine.out", yoyo: true, repeat: 1 }, 0)
    .to(s, { tuck: 1, duration: duration * 0.35, ease: "power2.out", yoyo: true, repeat: 1, repeatDelay: duration * 0.2 }, 0.05);
}

export function playTrick(name: TrickName, s: TrickState): gsap.core.Timeline {
  switch (name) {
    case "backflip":
      return rotation(s, "flip", -1, 1.6);
    case "frontflip":
      return rotation(s, "flip", 1, 1.6);
    case "barrelRoll":
      return rotation(s, "roll", 1, 1.8);
    case "spin":
      return rotation(s, "spin", 1, 1.5);
    case "stretch":
      return gsap
        .timeline()
        .to(s, { armL: 1, armR: 1, lift: 0.08, duration: 0.7, ease: "power2.out" })
        .to(s, { armL: 0, armR: 0, lift: 0, duration: 0.8, ease: "power2.inOut" }, "+=0.5");
    case "lookAround":
      return gsap
        .timeline()
        .to(s, { look: -1, duration: 0.7, ease: "power2.inOut" })
        .to(s, { look: 1, duration: 1.1, ease: "power2.inOut" }, "+=0.3")
        .to(s, { look: 0, duration: 0.7, ease: "power2.inOut" }, "+=0.3");
    case "wave":
      return gsap
        .timeline()
        .to(s, { armR: 1, wave: 1, duration: 0.45, ease: "power2.out" })
        .to(s, { armR: 0, wave: 0, duration: 0.5, ease: "power2.inOut" }, "+=1.1");
  }
}

/** Ends any trick smoothly: rotations finish the nearest whole turn, the rest eases to rest. */
export function settleTricks(s: TrickState, duration = 0.45) {
  gsap.killTweensOf(s);
  const target: Partial<TrickState> = { lift: 0, armL: 0, armR: 0, wave: 0, look: 0, tuck: 0 };
  for (const key of ROTATIONS) target[key] = Math.round(s[key]);
  return gsap.to(s, {
    ...target,
    duration,
    ease: "power2.out",
    onComplete: () => ROTATIONS.forEach((key) => void (s[key] = 0)),
  });
}

/** Picks a random trick that is not the previous one. */
export function nextTrick(previous: TrickName | null): TrickName {
  const options = TRICKS.filter((trick) => trick !== previous);
  return options[Math.floor(Math.random() * options.length)];
}
