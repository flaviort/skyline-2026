"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Register once per client bundle. Import gsap from here, never from "gsap" directly,
// so every component gets the plugins and the named eases.
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, CustomEase, DrawSVGPlugin, InertiaPlugin, ScrollTrigger, SplitText);

  // Named eases taken from the reference build. "osmo" is the house ease for
  // reveals and UI; "move" is for larger travel (cards, panels, page transitions).
  CustomEase.create("osmo", "0.625, 0.05, 0, 1");
  CustomEase.create("move", "0.3, 0.075, 0, 1");

  gsap.defaults({ ease: "osmo", duration: 1 });
}

export { gsap, CustomEase, DrawSVGPlugin, InertiaPlugin, ScrollTrigger, SplitText, useGSAP };
