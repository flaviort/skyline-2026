# Plan

Workflow: **plan, review, approve, then build, one part at a time.** Every part below gets its own spec, build and approval. Nothing starts until the part before it is approved. Internal pages follow the same rule.

## Foundations (done)

- [x] Next.js 16.3, React 19.2, TypeScript, Tailwind 4 (`src/`, App Router, `@/*` alias)
- [x] GSAP 3.15, `@gsap/react`, Lenis 1.3; plugins and the `osmo` and `move` eases in `src/lib/gsap.ts`
- [x] Lenis on the GSAP ticker, off for reduced motion (`src/components/providers/smooth-scroll.tsx`)
- [x] Fluid scaling ported from the reference: root 12px and hero headline 144px at 1440, same as the reference
- [x] Tokens and type utilities in `src/app/globals.css`; fonts self-hosted through `next/font`
- [x] Legacy logos, favicons, Nova and office photos in `public/` and `src/app/`
- [x] Planning docs, all under `docs/`
- [x] Plan decisions answered (below)
- [x] Specs written for all 11 homepage parts and all internal pages (`docs/specs/`), waiting for review

## Decisions

| # | Decision | Outcome |
|---|---|---|
| D1 | Accent color | **International orange `#ff4f00`.** Live in the tokens. |
| D2 | Team section | **No team section.** The agency/about part shows office photos and talks about the agency. The reference's team layout is reused for something else (see part 6). |
| D3 | Nova on the homepage | **Yes.** Originally through the banner's cursor media cards; replaced by D14. |
| D4 | Copy | **Approved as drafted** in `docs/CONTENT.md`. |
| D5 | Custom cursors | **Yes**, same set and behavior as the reference (Q5). |
| D6 | Media | **Image-led.** Skyline has lots of stills and case copy and fewer videos, so every media slot must look finished with a still; video is a bonus where it exists. |
| D7 | Deploy | **Vercel**, handled by the user. |
| D8 | Data | **Fully static.** No WordPress, no database. Projects are exported once from the old WordPress into typed files in the repo (see `docs/ARCHITECTURE.md`). |
| D9 | Language | **English only.** The reference is Dutch; nothing from it is translated or reused as copy. |
| D10 | Domain | `https://theskylineagency.com` (currently serving the old layout). Old URLs get redirects when the new site replaces it. |
| D11 | Fonts | **Inter Tight and Noto Serif Display (width 62.5)**, serif later dropped by D15, replacing the first picks. Both are variable 100 to 900, which the cursor weight effect needs (grotesk 700 to 200, serif 300 to 800), and both matched the originals side by side at those weights. |
| D12 | Part 6 concept | **A now, B over time**: launches as "Brands we've launched" with project images, then images are swapped for Nova in each client's world as the art gets made. |
| D13 | Code | **Reusable, prop-driven components, DRY.** Full inventory and rules in `docs/ARCHITECTURE.md`; new components are reviewed in the `/lab` route. |
| D14 | Banner follower | **3D Nova instead of the cursor media card** (2026-10-01). The 3D designer delivered a rigged Nova (with skeleton); it is rendered with three.js (React Three Fiber) on a page-wide transparent layer. Revised the same day: no fixed rest spot. He floats in from the top or a side, keeps floating around the banner (wandering when idle, gently following the mouse with his whole body, idle tricks like backflips), never leaves the screen while the banner is in view, floats out when the user scrolls down, and comes back at the bottom of the page peeking from the bottom middle (upper half) to look at the user and wave goodbye. Lazy loaded after the text. See `specs/home/01-banner.md` and `specs/home/08-footer.md`. |
| D15 | Typeface | **Sans only** (2026-10-01, after the first banner review). Inter Tight everywhere; the reference's serif line becomes a hairline Inter Tight accent line. Replaces D11's serif half. |
| D16 | Site theme | **Dark** (2026-10-01, after the first banner review): ink ground, off-white text across the site, replacing the white direction. Light remains a section theme. |

## Build order

Homepage, one part at a time. Status: `todo`, `spec` (written, waiting for approval), `build`, `review`, `approved`.

| # | Part | What it covers | Status |
|---|---|---|---|
| 1 | [Banner](specs/home/01-banner.md) | Hero: serif lead, headline, Discover more link, 3D Nova floating around and following the mouse | review |
| 2 | [Logos](specs/home/02-logos.md) | Client logo marquee under the banner, scroll-direction speed | spec |
| 3 | [Agency / about](specs/home/03-agency.md) | Office photo collage and the agency story, "More about us" | spec |
| 4 | [Recent projects](specs/home/04-recent-projects.md) | Dark band, pinned stack of framed project cards from the 6 real cases, rotating badge | spec |
| 5 | [What we do](specs/home/05-what-we-do.md) | Three tilted service cards (Strategy, Design, Growth) | spec |
| 6 | [Brands we've launched](specs/home/06-brands-launched.md) | Scattered parallax collage of client work with hand-lettered client names; grows into "Nova was here" | spec |
| 7 | [Contact CTA](specs/home/07-contact-cta.md) | "Ready for liftoff?" block with stickers trailing the mouse | spec |
| 8 | [Footer](specs/home/08-footer.md) | Wordmark, navigation, contact, socials, bottom bar, scroll to top, Nova's goodbye wave | spec |
| 9 | [Menu](specs/home/09-menu.md) | Fixed nav: logo, pill links, Contact button, custom cursors (D5); pulled ahead of 02 to 08 on 2026-10-02 | review |
| 10 | [Mobile](specs/home/10-mobile.md) | Full pass of parts 1 to 9 below 992px, mobile menu | spec |
| 11 | [Page transitions](specs/home/11-page-transitions.md) | 11a launch intro on every full load (pulled forward 2026-10-05); 11b route transitions, on hold | 11a review, 11b spec |

Then `DESIGN.md` is written from the finished homepage and the homepage gets a final review before internal pages start.

### Part 6: concepts considered

Decided: A at launch, turning into B (D12). Options for the record:

The reference's team section is a tall scatter of photos at different depths, each with a hand-lettered name sticker, plus loose stickers that react to the mouse. Ways to reuse it without a team:

- **A. Brands we've launched (recommended).** Project images from the 6 cases scattered at depth, each labeled with the client's name in hand lettering (Airly, Dymatize, Think Apollo...). Uses the material Skyline has most of, and doubles as a second proof point after Recent projects.
- **B. Nova's travel log.** Nova dropped into each client's world (holding an Airly snack, spotting a Dymatize lift). Most on-theme, but it waits on Nova art. A can grow into B piece by piece.
- **C. Made at 1529 Dragon St.** Behind-the-scenes and office shots with handwritten captions. Needs more office photography than the three we have.
- **D. The things we make.** A wall of deliverables grouped by craft (3D, photography, social, websites) with craft names as the labels. Overlaps with part 5.


## The loop for every part

Each part runs the same steps. Impeccable commands are in brackets.

1. **Spec.** The spec already exists in `docs/specs/`; at the start of the part it is re-read and updated if anything changed. Originally: I write `docs/specs/home/NN-part.md` (or `docs/specs/pages/<page>.md`) from `docs/specs/_TEMPLATE.md`: what the reference does there (measured), the Skyline version, content, assets, motion, the components it reuses, extends or adds, and acceptance checks. [`/impeccable shape`]
2. **Approve spec.** You approve or change it. No code before this.
3. **Components first.** New or extended library components are built with props and shown in `/lab`, then the part is composed from them. Layout, type and content only at this stage, following `docs/ARCHITECTURE.md` and impeccable's craft floor, compared side by side with the reference at 1440x900.
4. **Motion.** The part's animations, tuned against the reference's timings. [`/impeccable animate`]
5. **Self-check.** Impeccable detector on the changed files, one batched screenshot round (1440 desktop plus a 390 sanity check), fixes. [`impeccable detect`, `/impeccable audit`]
6. **Review.** You review in the browser. Small visual changes can go through live variants. [`/impeccable critique`, `/impeccable live`]
7. **Polish and approve.** Final pass, then your explicit approval, a commit on the working branch, and the status table updated. [`/impeccable polish`]

Mobile is its own part (10), so parts 1 to 9 only need to not break below 992px until then. Part 10 runs [`/impeccable adapt`] across everything.

### Impeccable at the milestones

| When | Command | Why |
|---|---|---|
| Before part 1 | `/impeccable hooks on` (optional) | Runs the design detector automatically after UI edits. |
| After part 5 | `/impeccable extract` | Audits the library for duplication that slipped through and folds it back into shared components and tokens. |
| After part 11 | `/impeccable audit` then `/impeccable harden` | Accessibility, performance, edge cases across the whole homepage. |
| After part 11 | Finish review + `/impeccable document` | Fresh reviewer checks the build against the direction contract; `DESIGN.md` is written from what shipped. |
| Before launch | `/impeccable optimize` | Core Web Vitals, image weight, bundle size. |

## Internal pages

Same loop, same per-part approval. Each page is broken into parts when its spec is written.

| Page | Route | Spec | Notes |
|---|---|---|---|
| About | `/about` | [about.md](specs/pages/about.md) | Agency story, office scatter, where we work |
| Work | `/work` | [work.md](specs/pages/work.md) | All 6 projects. Old `/projects` redirects here. |
| Project | `/work/[slug]` | [project.md](specs/pages/project.md) | Case template fed by the exported WordPress blocks. Old `/project?<slug>` redirects here. |
| Services | `/services` | [services.md](specs/pages/services.md) | The seven services under three pillars, orbit hero |
| Contact | `/contact` | [contact.md](specs/pages/contact.md) | Call and email buttons plus a form sent through an email API; no database. [`/impeccable clarify`] for form copy. |
| FAQ | `/faq` | [faq.md](specs/pages/faq.md) | 20 drafted questions, adjusted along the way (Q10) |
| Legal and cookies | `/privacy`, `/terms`, cookie banner | [legal.md](specs/pages/legal.md) | Cookie banner and preferences ported from igethi (Q11); policy text from the user or counsel. Banner must be live before any analytics runs. |
| 404 | `not-found` | [not-found.md](specs/pages/not-found.md) | Lost in space, with Nova |

Questions raised by the specs, with their answers, are in [specs/README.md](specs/README.md).

Reminder for part 02: ask the user for the client logo SVGs when that part starts.

## Working agreements

- Copy the reference's layout, spacing, type rhythm and motion. Never its copy, logo, font files or code.
- **Reference-sourced placeholders never ship.** Media or stickers taken from extrafazant for development live only in `public/_ref/`, which is gitignored, so it can't be committed or deployed. Every one is listed in the placeholder register in `docs/CONTENT.md` and replaced before launch.
- No invented claims: clients, numbers, awards and quotes only from the user or the old site.
- All copy, comments, docs and commits: English, no em dashes, no emojis, plain human voice.
- Work on a branch; commit once per approved part.
- **Check visual fixes before calling them done** (user, 2026-10-01, after a shoulder pipe was reported fixed while the review image still showed the bug). For any visual fix:
  1. Reproduce the exact case the user reported (same pose, angle and motion) before changing anything.
  2. After the fix, render that case again and look at the defect itself at full resolution: crop tightly around it and zoom in. Never judge from a downscaled contact sheet.
  3. Check more than one angle and pose, including the worst case (arms fully up, close to the screen, mid-trick).
  4. Say "fixed" only when the close-up shows it. Otherwise report what is still wrong, with the image.
