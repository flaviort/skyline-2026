# Part 08: Footer

Status: spec
Approved by / date:

The bottom of the dark band: big wordmark, three link columns, legal bar, scroll-to-top, and Nova saying goodbye from the bottom middle of the screen.

## Reference

Measured at 1440x900. Continues the CTA's dark band; about 330px including the bottom bar.

| Element | Position / size | Style |
|---|---|---|
| Main row | full content width, 288px tall, about 60px top spacing | |
| Wordmark | left half, centered in it, 336 x 129 | script logo, off-white |
| Columns | start at the page's center line (x 720): Navigation at 720, Contact at 934, Socials at 1193 | column label 12px grotesk uppercase; links in the serif 18px (1.5rem), leading 1.5 |
| Link underline | under each link | squiggle in pink, drawn on hover; persists on the current page's link |
| Scroll to top | top right of the main row (x 1400) | small square button with an up arrow |
| Bottom bar | 45px tall | left: "© 2026 Name" serif 13.5px; right half from x 720: legal links in 12px grotesk |

## Skyline version

- Wordmark: `public/brand/logo-wordmark.svg` in off-white.
- Columns: Navigation (About, Work, Services, FAQ, Contact), Contact (1529 Dragon St, Dallas, TX 75207 / accounts@theskylineagency.com / +1-972-861-0416), Socials (Instagram, LinkedIn, Behance, Facebook, X).
- Squiggle color: orange.
- Bottom bar: © current year The Skyline Agency LLC / Privacy / Terms / Cookie preferences (opens the cookie dialog, see `specs/pages/legal.md`).
- **Nova's goodbye runs on the homepage only for now** (decided 2026-10-01); other pages get the plain footer until decided.
- **Nova's spot.** In the reference, the columns and the legal links start at the center line, right where Nova peeks up. So the footer keeps a clear area in the bottom middle for him. The bottom bar splits to the sides (copyright on the left, legal links on the right) with Nova between them, and the link columns shift right so none of them sits above the center. Nova sits in front of the footer but never over a link.
- Address links to Google Maps; email and phone use `mailto:` and `tel:`; socials open in a new tab with `rel="noreferrer"`.

## Content

- All from `src/content/site.ts` (`nav`, `contact`, `socials`, `legal`).
- Year computed at build time (static site; a rebuild each January is enough) or on the client for correctness. Decision in build: client-side with the build year as fallback.

## Assets

| Asset | Source | Status |
|---|---|---|
| Wordmark SVG | `public/brand/logo-wordmark.svg` | On hand |
| Up arrow icon | Shared icon set | Built in |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Columns | enter view | Scroll reveal group | `expo.out`, 1s, 0.12s apart |
| Links | hover | Squiggle draws in, draws out on leave; current page link keeps it | `power2.inOut`, 0.5s |
| Scroll to top | click | Scrolls to top through Lenis | 1.2s |
| Nova goodbye: rise | the user reaches the bottom of the page (footer bottom within the last 15% of the scroll) | The same Nova from the banner rises from below the bottom edge, centered, until his upper half is visible (visor and chest; the rest stays below the screen edge) | about 1s, a slight overshoot as he arrives |
| Nova goodbye: look | pointer moves | Looks at the user, then follows the mouse with his gaze (upper spine turns toward it, clamped); a little body sway | damped springs |
| Nova goodbye: wave | after he arrives, then every few seconds | Waves goodbye with one arm (arm raised, forearm and hand swinging 2 or 3 times), then lowers it; uses the designer's `Wave` clip if it exists, otherwise procedural on `Arm_01.R`, `Arm_02.R` and `Hand.R` | about 1.5s per wave |
| Nova goodbye: sink | scrolling back up | Sinks back below the edge | scrubbed to scroll |

Reduced motion: Nova's still upper-half pose appears in his spot with no rise or wave. Touch: same goodbye, gaze follows the last touch point or rests looking at the user.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `DrawLineLink` | reuse | `variant="footer"` (serif 1.5rem) | `persist` for the current page |
| `IconButton` | new | `icon`, `label`, `onClick` | Scroll to top; reused for the menu toggle |
| `Footer` | new, layout | content from `site.ts`, `novaSpot` | In the root layout, shared by every page; `novaSpot` keeps the bottom middle clear |
| `NovaLayer` | extend | `goodbye` scene: trigger, rise, peek height, wave interval | Same Nova instance as the banner |
| `novaTricks` | extend | `wave` used as the goodbye | |

## Acceptance

- [ ] Column positions and type sizes match the reference at 1440
- [ ] Every link works: pages, mailto, tel, maps, socials
- [ ] Current page link shows its squiggle
- [ ] Nova's goodbye: rises only at the bottom, shows his upper half, looks at the mouse, waves, sinks when scrolling up; never covers a link
- [ ] Nova reads well on the dark band (lighting tuned for both the light banner and the dark footer)
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] Keyboard path covers every link and the scroll-to-top button
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
