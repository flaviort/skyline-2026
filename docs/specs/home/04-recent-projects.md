# Part 04: Recent projects

Status: spec
Approved by / date:

The dark band. A pinned stack of framed project cards that peel away one by one as you scroll. This is the page's signature moment.

## Reference

Measured at 1440x900. Section about 3060px tall (pin length included), theme dark (`#101010`), `data-nav-theme="dark"`.

| Element | Position / size | Style |
|---|---|---|
| Serif lead | centered above the heading | two lines, serif, off-white |
| Heading | centered, about 200px below section top, 509 x 79 | `heading-xl` at this width: 96px (8rem), grotesk "RECENT" 500, serif "WERK" |
| Stack area | full width, cards centered | perspective on the stack root |
| Front card | 720 x 411 (60rem x about 34rem) | solid color frame 15.75px (1.3125rem) as padding, image 689 x 380, dark gradient overlay at the bottom |
| Card title | bottom center, over the image | 72px (6rem) grotesk 700 uppercase, off-white |
| Cards behind | each one 120px deeper (z) and 40px higher (y) than the one in front | frames in yellow `#fee897`, blue `#0038ff`, red `#f44a32` |
| Button | centered under the stack, 151 x 36 | pink `#ff77cd` label and chip, ink text |
| Badge | bottom right, 108 x 108 (9rem), 36px from the right edge | circular rotating text "THIS IS HOW WE SCROLL" |

## Skyline version

- Five projects, in this order (Q1, approved): Airly, Dymatize, Think Apollo, Barker Wellness, Andrew Callaghan.
- Frame colors come from each project's own brand (Q2, approved), the way the reference frames its cases in their clients' colors. Note for the build: the color stored in the old WordPress for Dymatize (`#333e4e`, dark slate) and Think Apollo (`#0d151c`, near black) is darker than their brands' signature red and blue, so frames use the brands' signature colors, picked side by side with the covers in this part and stored as `frameColor` in each project file.
- Title: client name. The project subtitle ("Climate friendly snacking") rides in the cursor marquee pill on hover.
- Media: each project's strongest still (image-led, D6); a muted loop replaces it where a good clip exists.
- Button: "See all work" in lilac with ink text (dark-theme button tokens). Badge text: THIS IS HOW WE ORBIT.
- Cards link to `/work/<slug>`, which exists once the project page is built; until then they link to the work anchor.

## Content

- Lead: Hard to miss, easy to share. / A few missions we flew lately.
- Heading: RECENT *WORK*
- Cards: from `src/content/projects/*` (`title`, `subtitle`, `slug`, `cover`)
- Button: See all work, `/work`
- Badge: THIS IS HOW WE ORBIT

## Assets

| Asset | Source | Status |
|---|---|---|
| Project covers and loops | WordPress export (run in this part) into `public/images/work/<slug>/` | To export |
| Badge ring text | Built as SVG text on a circle | Built in |

### WordPress export

This part runs `scripts/export-wordpress.mjs` once (see `docs/ARCHITECTURE.md`): all 6 projects, every image and video, typed files in `src/content/projects/`. The output is committed and the site never calls WordPress again.

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Lead, heading | section enters (top 85%) | Line and char reveals as in part 03 | `expo.out`, 1s |
| Stack setup | load | Card i sits at `z: -120 x i`, `y: -40 x i`, stacked with the front card on top | |
| Pin | section top hits viewport top | Pin the stack area for (cards - 1) x 100vh of scroll | scrub 0.3 |
| Card exit | per step of the pin | Front card drops by 90% of the viewport height; fades out in the last 30% of its step; the cards behind move forward one slot | drop `power2.in`; the rest linear; one step per card |
| Badge | across the whole pin | Rotates 180deg | linear, scrubbed |
| Stack tilt | pointer over the pinned area | Stack root tilts toward the pointer: up to 6deg on X, 10deg on Y | `quickTo`, 0.6s `power3`; resets on leave |
| Cursor marquee | pointer over a card | A pill follows the pointer (0.4s `power3`) and opens from a dot with a clip-path; inside, the project subtitle scrolls as a marquee at 5 characters per second; closes 0.4s after leaving | card open 0.4s `cubic-bezier(.75,0,.25,1)` |
| Button | hover | Same `Button` hover as part 03 | |

Under 992px there is no pin: cards stack in normal flow at full width with their frames and titles, and the badge rotates with scroll. Reduced motion: no pin, no tilt, no marquee.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Section` | reuse | `navTheme="dark"` | Menu flips to light over this band (part 09) |
| `Heading`, `Lead`, `ScrollReveal`, `Button`, `Frame`, `Media` | reuse | | |
| `ProjectCard` | new | `project`, `variant="stack"`, `frameColor`, `titleSize` | Same card later in variant `grid` (work page) and `collage` (part 06) |
| `FeaturedStack` | new | `depth` (120), `offset` (40), `tiltX` (6), `tiltY` (10), `scrollPerCard` (1), `pinFrom` (992) | Content-agnostic: takes any children |
| `Badge` | new | `text`, `size`, `spin` (180), `target` (a timeline or scroll) | |
| `CursorMarquee` | new | global provider plus a `data-cursor-marquee-text`-style prop on targets | One pill for the whole site; the work page reuses it |

## Acceptance

- [ ] Stack depth, offsets and card size match the reference at 1440
- [ ] Pin starts and ends cleanly; no jump when it releases into part 05
- [ ] Titles stay readable on every cover (overlay gradient tuned per image if needed)
- [ ] Unpinned layout under 992px is complete and tidy
- [ ] Export script output committed; no runtime request to WordPress anywhere
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] Reduced motion and keyboard paths work (each card is a link with a visible focus state)
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
