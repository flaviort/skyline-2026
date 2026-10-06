# Status

Handoff note: where the project stands, what is next, and what is missing. Last updated 2026-10-05. Read this first in a new session, then `docs/PLAN.md`.

## Where we are

- **Phase:** homepage, part 01 (banner) is built and in **review**. It has been through two review rounds with the user and is waiting for an explicit approval before part 02 starts.
- **Repo:** this folder (`skyline-2026_git`, GitHub remote `flaviort/skyline-2026`). **Nothing is committed yet**; the first commit happens when the user asks. The previous folder (`../skyline-2026`, GitLab remote, one commit "new website pt1") still exists untouched as a backup; delete it only if the user asks.
- **Docs:** everything lives in `docs/` (index: `docs/README.md`). Specs for all 11 homepage parts and all internal pages are written (`docs/specs/`); 26 review questions are all answered (`docs/specs/README.md`).

## Decisions that changed the original plan

The specs for parts 02 and later were written before these; apply them when each spec is re-read (also noted in `docs/specs/README.md`):

- **Dark site** (D16): ink `#101010` ground, off-white `#f4f4f4` text everywhere. Light is still available per section with `Section theme="light"`.
- **Sans only** (D15): Inter Tight is the only typeface. The reference's serif line is a hairline accent line (weight 150, thickening to 700 near the cursor). `SerifLead` became `Lead`.
- **Nova in 3D** (D14): a rigged model replaces the reference's cursor media card. He floats in from the top or a side, wanders, follows the mouse with his whole body, does idle tricks, floats out on scroll, and (part 08) peeks up at the bottom of the homepage to wave goodbye. He stays in front of the text but never covers a link.
- Orange `#ff4f00` accent; anything written on orange is ink, never white (Q17).

## What is built (part 01)

| Area | Files |
|---|---|
| Banner section | `src/components/sections/home/banner.tsx`, copy in `src/content/home.ts` |
| Type | `Heading` (bold lines plus accent line, fits its column), `Lead` (two lines, line fit) in `src/components/type/` |
| Text motion | `useKineticText` (masked reveal plus cursor weight effect on one SplitText split), `useFitText` (shrinks text only when a word or line would not fit) in `src/components/motion/` |
| UI | `DrawLineLink` (squiggle link, 6 hand-drawn squiggles), `ArrowChip`, `Icon` (legacy SVGs, no icon library), `Section` |
| Nova | `src/components/three/`: `nova-layer.tsx` (page-level loader, fallbacks), `nova-stage.tsx` (canvas, motion, springs, tricks scheduling), `nova-rig.ts` (bone map, root-space posing), `nova-tricks.ts`, `nova-look.ts` (studio lighting and materials) |
| Model | source `.blend` in `assets/3d/nova/` (gitignored), built by `scripts/nova/fix.py` into `public/models/nova.glb` (359 KB) via `npm run model:nova` |
| Foundations | fluid scale and tokens in `src/app/globals.css`, GSAP setup `src/lib/gsap.ts`, Lenis `src/components/providers/smooth-scroll.tsx`, shared pointer `src/lib/pointer.ts` |
| Lab | `/lab` (dev only): every component on its own, plus Nova in a box with a button per trick |

Below the banner sits part 01b (about), then a temporary placeholder for part 03.

## Part 01b, about, built and in review (2026-10-05)

The old site's About block (legacy copy) centered under the banner, with Nova taking the old 3D S's move: as the banner leaves he frontflips to the middle of the screen, lands softly on the spot above the heading, holds there until the text arrives, then rides off with it. He keeps floating the whole time (user). Spec and as-built notes: `docs/specs/home/01b-about.md`. Files: `src/components/sections/home/about.tsx`, `src/components/type/eyebrow.tsx`, the landing block in `src/components/three/nova-stage.tsx`, `src/lib/nova-landing.ts`; `PillButton` got `tone` and `size`, `useKineticText` got `reveal.scroll`. Open questions taken with defaults (part 03 stays, heading ABOUT, no wave after landing); the user can still change them. Also fixed: Nova vanished after scrolling down past him and back up (canvas clock reset).

**Round 2, the space journey** (same day, user: "make it more interesting and creative"): between the banner and the about section, about four screens of scroll where Nova stays on screen and floats through space: a chubby rocket blasts past (he twirls in its wake), an asteroid field (he kicks off one rock), a ringed planet he circles in depth, a UFO whose alien waves while its beam lifts him (he waves back), sparkle stars throughout; then the frontflip and landing. All built in code in Nova's lacquer style (`space-journey.ts` timeline, `space-cast.tsx` objects); the 3D designer can replace any object later. Scrolling back up returns him to his banner home on the middle-right. No mission log captions for now (offered; they would be new copy). Same day: review tweaks (Despicable Me / Illumination vibe, not childish: sharper rocket, more craters, glowing stars, a detailed planet, a green alien and a livelier UFO, stars around the about text) and phone tilt for Nova (`src/lib/tilt.ts`; iPhones ask for motion permission on the first tap). Tilt was verified with emulated orientation in headless Chrome only; it still needs a check on a real iPhone and Android phone.

## Next steps

**Banner direction F built** (2026-10-02, in review; copy waiting for approval in `docs/CONTENT.md`). Spec: the direction F section of `docs/specs/home/01-banner.md`. Exploration notes: concepts in the design canvas https://claude.ai/artifact/HWArLmV2VEn9UWqzeW8LYx (round 1: A Mission Control, B Earthrise, C Mission Patch, D Launch Sequence; round 2: E and F combine A and D, plus E on mobile). User direction so far:
- **F is the closest** (user, 2026-10-02): "We launch / brands" with the blinking caret and word list, the readout bar, the "Nova / EVA-01, Orbit stable" tag, the ripple Scroll button. The orbit ellipse around Nova is removed for now.
- Keep the live 3D Nova as built; follow the old site's layout (left-aligned two-tier headline, hero object right, bottom row with copy and a round Scroll button).
- Keep from A: the readout bar (Dallas coordinates, Dallas time, "Signal acquired") and the "Nova / EVA-01, Orbit stable" label. No aim ring around Nova (alternatives in E and F).
- Scroll button with a ripple like Nova's antenna beacon.
- **No outlined text anywhere** (a no-go).
- **Stars from the old site, kept and lighter:** the old version is 1,000 separate 3D meshes (`../skyline-2023/assets/js/functions.js`, around line 356 and 639): the cloud turns slowly all the time, and scrolling pushes it up 500 units over three viewports with `scrub: 3`, so the faster you scroll the faster the stars move, and they ease to a stop. The new version keeps that exact behavior (constant slow drift, scroll speed adds smoothed motion, eased stop) on one particle system (one draw call), paused when off screen.


0. **Part 11a, launch intro, built and in review** (pulled forward by the user on 2026-10-05; spec approved the same day). Reference: a Codegrid video rebuilding good-fella.com's intro, measured on good-fella.com itself. Every full page load: orange screen from the first paint, "T-minus 04" countdown with four stage lights tied to real loading milestones (5s cap), "Liftoff", a clip-path sweep, then the banner builds (block reveal on both headline lines, menu, readout, stars, Nova). Nova now loads under the cover and holds the countdown until his model is ready. All entrances play from one cue (`whenPageReady()`), so route transitions (11b, on hold) only need to fire it. Files: `src/components/layout/launch-intro.tsx`, `src/components/motion/{block-reveal.tsx,use-page-entrance.ts}`, `src/lib/{page-ready,intro}.ts`. Lab entries with replay and a slow-network mode. Copy (T-minus, Liftoff) waits for approval in `docs/CONTENT.md`.

0. **Part 09, menu, built and in review** (pulled forward by the user on 2026-10-02; part 01 stays in review, the user will come back to the banner). Logo `S.` in white with a difference blend (inverts over light areas), black link box and black Contact button (user's choice), reference cursors as placeholders, mobile panel under 768px. Files: `src/components/layout/{menu,nav-pill,mobile-menu}.tsx`, `src/components/ui/{pill-button,logo-mark}.tsx`, `src/content/site.ts`, cursor and `.pill-button` styles in `globals.css`.


1. **Get part 01 approved** (user review in the browser at `http://localhost:3000` and `/lab`). On approval: set status `approved` in `docs/PLAN.md`, `docs/specs/README.md` and `docs/specs/home/01-banner.md`, and commit when the user asks.
2. **Part 02, logos:** re-read `docs/specs/home/02-logos.md`, update it for the dark site, **ask the user for the client logo SVGs**, get the spec approved, then build (the `Marquee` component and the logo band in the banner's bottom 11rem).
3. Continue the build order in `docs/PLAN.md`: 03 agency, 04 recent projects (runs the one-time WordPress export), 05 what we do (then `/impeccable extract`), 06 brands we've launched, 07 contact CTA, 08 footer (plus Nova's goodbye), 09 menu, 10 mobile, 11 page transitions. Each part: re-read spec, user approval, build in `/lab` first, review, user approval.

## Waiting on the user or others

| Item | Needed for | From |
|---|---|---|
| Approval of part 01 | starting part 02 | user |
| Client logos, SVG | part 02 | user (ask when part 02 starts) |
| Nova: optional clips (`Idle_Float`, `Wave`, tricks) | motion | 3D designer |
| Skyline stickers (astronaut theme, internal jokes) | parts 03, 06, 07 (reference stickers are dev placeholders until then) | user |
| Hand-lettered client names | part 06 | user (set type stands in) |
| More office photos | about page | user (current photos plus stock placeholders until then) |
| Resend keys now, SendGrid later | contact form | user, when the contact page is built |
| Answers to the `[confirm]` FAQ items | FAQ page | user |
| Privacy policy and terms text | legal pages | user or counsel |
| Latest capabilities deck PDF | about page (2023 PDF until then) | user |

## Known issues and notes

- **Nova fallbacks** (2026-10-02): some visitors never saw Nova on the deployed site. Likely causes found: no WebGL 2 or no WebAssembly on their browser, and failures that showed nothing. Every failure now shows the still image with a `[nova]` console line naming the reason (details in `docs/NOVA-3D.md`). Ask anyone who still sees no Nova for their browser and OS and that console line.
- **Placeholder cursors are development only:** they live in the gitignored `public/_ref/`, so they 404'd in production. They now load only in development (`src/components/providers/dev-cursors.tsx`); production uses system cursors until Skyline's own are drawn.
- **Expected 404s in production:** the menu prefetches /about, /work, /services and /contact, which are not built yet.

- **Nova entrance** (reworked 2026-10-01): flies head first toward the viewer from just outside the top-left corner, diagonally behind the text to the bottom middle; levels out, comes in front, backflips to the middle, waves. Earlier feedback that it was not fluid still needs the user's eye on the new version. Spec in `docs/specs/home/01-banner.md`; code in the entrance block of `nova-stage.tsx`.
- **Shoulders**: arms and body are fused into one suit by `scripts/nova/fix.py` (arms lifted 0.6 rad in the rest pose, seam rounded and weights blended; no shoulder pipes or straps). If the designer changes the arms or body, re-run `npm run model:nova` and check the stretch and wave.

- **Nova on phones** is large and covers part of the lead and headline; planned for part 10 (mobile).
- **Nova model** is built from the designer's `.blend` by `scripts/nova/fix.py` (`npm run model:nova`, needs Blender). Nothing is patched in code any more; arms and body are fused into one suit by the script. Details in `docs/NOVA-3D.md`.
- **Render** is close to the old about-page image (`public/images/legacy/nova.png`), including the blue sheen on the suit (its own reflection studio since 2026-10-01); the remaining gap is soft glow (bloom) around the antenna light and visor highlights. Possible with post-processing at a performance cost; only if the user asks.
- **Verifying motion:** the in-app browser pane throttles animation frames and serves stale screenshots when it is hidden. Reliable captures came from headless Chrome driven by `puppeteer-core` against a production build (`npx next build && npx next start -p 3100`), installed in a scratch folder, never in the project.
- **Placeholders from the reference** must live only in `public/_ref/` (gitignored) and be listed in the register in `docs/CONTENT.md`. None are in use yet.

## How to run

```bash
npm install
```

```bash
npm run dev
```

Then open `http://localhost:3000` (homepage) and `http://localhost:3000/lab` (component lab). After replacing the Nova source file in `assets/3d/nova/`:

```bash
npm run model:nova
```
