# Reference teardown: extrafazant.nl

Measured on 2026-09-25 from the live homepage at 1440x900 and from its published CSS and scripts. This is the source of truth for "how the reference does it". Skyline copies the layout, rhythm and motion; it never copies their assets, copy, logo, font files or code.

Built in Webflow with components from Osmo Supply. Stack on the page: GSAP 3.15 (ScrollTrigger, SplitText, DrawSVGPlugin, InertiaPlugin, CustomEase), Lenis 1.3, Barba 2.10 for page transitions, hls.js with Bunny Stream for video.

## 1. Scaling system

Everything is sized in `em` against one body font-size that scales with the viewport. The design canvas is 1920px wide with a 16px unit.

```
--size-container: clamp(min, 100dvw, max)
--size-font: calc(size-container / (ideal / 16))
```

| Range | Ideal canvas | Container clamp | Body font at the low end | Page padding | Grid gap |
|---|---|---|---|---|---|
| Desktop, 992px and up | 1920 | 992px to 3840px | 8.3px at 992, 12px at 1440, 16px at 1920 | 2em | 2em |
| Tablet, 991px and down | 991 | 768px to 991px | 12.4px at 768 | 1.5em | 1.5em |
| Mobile landscape, 767px and down | 767 | 480px to 767px | 10px at 480 | 1.25em | 1.25em |
| Mobile portrait, 479px and down | 479 | 320px to 479px | 13px at 390 | 1.25em | 1.25em |

Ultrawide (aspect wider than 11:5) caps the canvas to 16:9 of the viewport height.

Skyline port: the same maths drives `html { font-size }`, so Tailwind's rem utilities scale with it. See `src/app/globals.css`.

## 2. Color

| Token | Value | Use |
|---|---|---|
| off-white | `#f4f4f4` | Page ground |
| white | `#ffffff` | Nav pill, button faces |
| black | `#101010` | Text, dark bands (work stack, footer) |
| blue | `#0038ff` | Brand: logo, arrow chips, primary buttons |
| pink | `#ff77cd` | Buttons on dark bands |
| orange | `#ff5f04` | Card frames, stickers |

Card frames also use a pale yellow and a red-orange. Sections switch theme through variables (`background`, `body-text`, `heading`, `border`, `button-bg`, `button-text`, cursor selection colors); dark sections carry `data-nav-theme="dark"` so the nav logo turns white over them.

## 3. Type

Fonts: **Helvetica Now** (headings and body, variable 50 to 1000) and **Serrif** (alt heading, variable 100 to 900). Both commercial.

Headings: uppercase, letter-spacing `-0.02em`, line-height `0.8em` (large) or `0.9em` (small).

| Style | Desktop | Tablet | Mobile L | Mobile P | Weight |
|---|---|---|---|---|---|
| heading-xxl | 12em (192) | 6.5em | 5em | 4em | 700 |
| heading-xl | 8em (128) | 5.5em | 4.5em | 3.5em | 700 |
| heading-l | 6em (96) | 4.5em | 3.5em | 2.75em | 500 |
| heading-m | 5em (80) | 3.5em | 2.75em | 2.5em | 700 |
| heading-s | 4em (64) | 2.75em | 2em | 2em | 700 |
| heading-xs | 2.5em (40) | 1.5em | 1.25em | 1.25em | 700 |
| heading-xxs | 1.5em (24) | 1.25em | 1.25em | 1.25em | 700 |

Paragraphs: weight 500, letter-spacing `-0.04em` (`-0.03em` at small sizes), line-height 1.4 (1.3 at xl and small sizes).

| Style | Size |
|---|---|
| paragraph-xl | 2.5em |
| paragraph-l | 1.5em |
| paragraph-m | 1.25em (1.125em on mobile portrait) |
| regular | 1em |
| s / xs / xxs | 0.875em / 0.75em / 0.625em |

Measured at 1440: hero headline 144px, serif lead lines 36px with 36px leading, nav links 12px uppercase weight 500. Body copy uses `text-wrap: balance`.

Signature typographic move: a stack of heavy grotesk caps where one line switches to the light display serif at the same size ("BRENGT JE MERK IN / BEWEGING", "RECENT WERK", "WAT WE DOEN", "ABCDEF-TEAM").

## 4. Layout

- 12-column grid with column helpers built as `calc((100vw - page-padding) / 12 * n)`; 8 and 5 column variants for tablet.
- Sections use `section-padding-128px` style vertical rhythm (8em top and bottom on desktop).
- Almost every section is centered on the vertical axis of the page. Asymmetry comes from tilted media, not from off-center text.

## 5. Homepage anatomy (1440x900, total height about 9450px)

| # | Section | Height | Theme | What it does |
|---|---|---|---|---|
| 0 | Nav (fixed) | 64px | follows section | Script logo top-left (blue, white on dark). Centered white pill with OVER / WERK / WAT WE DOEN. White CONTACT button top-right. Mobile: toggle menu. |
| 1 | Hero | 100vh | light | Serif two-line lead (36px). Headline in three caps lines plus one serif line (144px). "Ontdek meer" link with hand-drawn squiggle underline and a blue arrow chip. Client logo marquee along the bottom edge, speed reacting to scroll direction. One media card follows the cursor over the hero and swaps clips every 300px of travel. |
| 2 | Intro | about 765px | light | Left: two tilted polaroid photos plus a sticker; hovering one focuses it while the others shrink and move aside. Right: serif lead, headline (caps line plus serif line), short paragraph, button with arrow chip. |
| 3 | Featured work | about 3060px | dark | Serif lead plus "RECENT WERK". Pinned stack: framed video cards (each frame a different color) rise and stack as you scroll; project name in heavy caps over the media. "Bekijk ons werk" button pinned below. Rotating circular badge bottom-right ("THIS IS HOW WE SCROLL"). |
| 4 | Services | about 920px | light | "WAT WE DOEN" headline. Three tilted framed cards (Animatie / Video / Social), each with a one-line serif description; video plays on hover; same hover-to-focus collage. "Ontdek meer" squiggle link below. |
| 5 | Team | about 2740px | light | Round logo sticker plus "ABCDEF-TEAM" headline. Scattered photos at different depths with parallax, hand-lettered name stickers, "Geen praatjes, wel plaatjes" sticker, text weight reacting to the cursor. "Ontdek meer over ons" link. |
| 6 | Footer | about 1060px | dark | "OOK IETS IN / BEWEGING BRENGEN?" headline, one line of copy, pink button. Image trail follows the cursor over this area. Large script logo left; columns Navigatie / Contact / Socials; bottom bar with copyright, privacy, terms, credit. Scroll-to-top button. |

## 6. Motion inventory

Named eases (GSAP CustomEase):

- `osmo`: `0.625, 0.05, 0, 1` (house ease for reveals and UI)
- `move`: `0.3, 0.075, 0, 1` (larger travel)

Other eases in use: power2.out, power3.out, expo.out, back.out(2.5) for pops, `none` for scrubbed scroll work. Most common durations: 1s, 0.6s, 0.3s to 0.45s. Stagger 0.05s.

Smooth scroll: Lenis `lerp: 0.165`, `wheelMultiplier: 1.25`.

| Component | Where | Behavior |
|---|---|---|
| Page transition + loader | global | A full-screen scribble stroke (DrawSVG) draws in thick to cover the page, then unwinds and thins to reveal the next one; see part 11 spec. |
| Text reveal | hero | SplitText by lines and chars, masked rise on load. |
| Scroll reveal | all sections | Elements, lines or chars rise into view on scroll, grouped with stagger. |
| Draw line | links in hero, services, team, footer | Hand-drawn squiggle under links drawn with DrawSVG on hover. |
| Button 052 | intro, work, footer | Label slides left and tilts (-3deg) on a spring `linear()` ease while an arrow icon scales in; arrow chip on the left. |
| Button 093 | global | Pill button that grows in width and height on hover. |
| Cursor card | hero | A single card follows the pointer (1s `power4`), tilts with horizontal speed, and swaps to the next clip every 300px of travel; hides over links. |
| Logo marquee | hero | Infinite marquee; speed and direction follow scroll direction. |
| Interactive collage | intro, services | Hover focuses a card (scale 1.075, straight); the others shrink to about 0.9, move aside and tilt randomly within ±5deg; 0.8s `move`. Tap to focus on touch. |
| Featured stack | work | ScrollTrigger pin; each card slides up and stacks on the previous one, frames offset. |
| Cursor marquee | global | A pill with scrolling text follows the cursor over work items, opening with a clip-path from a dot. |
| Video on hover | services | Card video plays while hovered. |
| Team parallax | team | Photos move at different speeds. |
| Momentum hover | team | Stickers get pushed by pointer velocity (InertiaPlugin). |
| Font weight hover | hero, team, footer | Per-character variable weight driven by cursor distance, radius 400px. Grotesk lines go from 700 at rest to 200 near the cursor; serif lines go from 300 at rest to 800. So the two fonts trade weight as the pointer passes. |
| Image trail | footer CTA | Sticker SVGs spawn every (viewport width / 8) px of travel, pop in with `elastic.out`, drift 4x the pointer movement, then shrink away. |
| Rotating badge | work | Circular text badge spins with scroll. |
| Custom cursors | global | SVG cursors for default, text, pointer, grab, grabbing. |
| Scroll to top | several | Button that scrolls to top through Lenis. |

## 7. Details worth copying

- Buttons: 3em tall, 1em horizontal padding, focus ring offset `-0.125em`, hover transitions 0.8s on the spring curve.
- Nav stays minimal: 12px uppercase links in a small white pill, no borders or shadows.
- Every media card has a thick solid color frame and a slight rotation; no drop shadows on the light ground.
- Balanced text wrapping on all copy.
- Reduced-motion and no-JS fallbacks force reveal targets visible.

## 8. Internal pages (surveyed 2026-09-25)

| Page | Sections |
|---|---|
| About (`/over`) | Hero with sticker trail and weight hover; team scatter with role lines, parallax and momentum stickers; CTA and footer |
| Work (`/werk`) | Header; three-column grid of white cards, middle column offset with 120px parallax, hover video, cursor marquee; CTA and footer |
| Project (`/werk/<slug>`) | Split screen with sticky color panel and step-driven media; result video; more work; CTA and footer. Back arrow replaces the menu. |
| Services (`/wat-we-doen`) | Hero with orbiting stickers that speed up on scroll; large statement paragraph; sticky service steps with color panels; CTA and footer |
| Contact (`/contact`) | Sticker, CTA headline, call and mail buttons; footer without CTA |
| FAQ (`/faq`) | Accordion groups by topic, one open at a time; CTA and footer |

Details per page are in `docs/specs/pages/`.
