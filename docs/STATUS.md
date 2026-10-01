# Status

Handoff note: where the project stands, what is next, and what is missing. Last updated 2026-10-01. Read this first in a new session, then `docs/PLAN.md`.

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
| Nova | `src/components/three/`: `nova-layer.tsx` (page-level loader, fallbacks), `nova-stage.tsx` (canvas, motion, springs, tricks scheduling), `nova-rig.ts` (bone map, rig patches, root-space posing), `nova-tricks.ts`, `nova-look.ts` (studio lighting and materials) |
| Model | source `assets/3d/nova/` (gitignored), optimized `public/models/nova.glb` (168 KB) via `npm run model:nova` |
| Foundations | fluid scale and tokens in `src/app/globals.css`, GSAP setup `src/lib/gsap.ts`, Lenis `src/components/providers/smooth-scroll.tsx`, shared pointer `src/lib/pointer.ts` |
| Lab | `/lab` (dev only): every component on its own, plus Nova in a box with a button per trick |

Below the banner, `src/app/page.tsx` has a temporary placeholder section so the scroll-out can be reviewed. Part 03 replaces it.

## Next steps

1. **Get part 01 approved** (user review in the browser at `http://localhost:3000` and `/lab`). On approval: set status `approved` in `docs/PLAN.md`, `docs/specs/README.md` and `docs/specs/home/01-banner.md`, and commit when the user asks.
2. **Part 02, logos:** re-read `docs/specs/home/02-logos.md`, update it for the dark site, **ask the user for the client logo SVGs**, get the spec approved, then build (the `Marquee` component and the logo band in the banner's bottom 11rem).
3. Continue the build order in `docs/PLAN.md`: 03 agency, 04 recent projects (runs the one-time WordPress export), 05 what we do (then `/impeccable extract`), 06 brands we've launched, 07 contact CTA, 08 footer (plus Nova's goodbye), 09 menu, 10 mobile, 11 page transitions. Each part: re-read spec, user approval, build in `/lab` first, review, user approval.

## Waiting on the user or others

| Item | Needed for | From |
|---|---|---|
| Approval of part 01 | starting part 02 | user |
| Client logos, SVG | part 02 | user (ask when part 02 starts) |
| Fixed Nova file: zipper, flags, backpack detail, antenna and feet parented to bones, backpack leg weights removed, right hand included, optional clips (`Idle_Float`, `Wave`, tricks) | replaces the code patches in `nova-rig.ts` | 3D designer (list in `docs/NOVA-3D.md`) |
| Skyline stickers (astronaut theme, internal jokes) | parts 03, 06, 07 (reference stickers are dev placeholders until then) | user |
| Hand-lettered client names | part 06 | user (set type stands in) |
| More office photos | about page | user (current photos plus stock placeholders until then) |
| Resend keys now, SendGrid later | contact form | user, when the contact page is built |
| Answers to the `[confirm]` FAQ items | FAQ page | user |
| Privacy policy and terms text | legal pages | user or counsel |
| Latest capabilities deck PDF | about page (2023 PDF until then) | user |

## Known issues and notes

- **Nova on phones** is large and covers part of the lead and headline; planned for part 10 (mobile).
- **Nova rig** is patched in code at load (antenna and feet re-parented, loose pieces attached, backpack reweighted, missing right hand mirrored). Each patch only runs when it detects the problem, so a fixed file passes through untouched. Arm raises are capped near horizontal because the suit hoses stretch.
- **Render** is close to the old about-page image; the remaining gap is soft glow (bloom) around the antenna light and visor highlights. Possible with post-processing at a performance cost; only if the user asks.
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
