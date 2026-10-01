# Part 06: Brands we've launched

Status: spec
Approved by / date:

The reference's team section, reused for client work (D12): a tall scatter of portrait images at different scroll speeds, each labeled with a hand-lettered client name, plus loose stickers that get knocked around by the mouse. Launches with project images (A) and turns into "Nova was here" (B) as Nova art replaces them.

## Reference

Measured at 1440x900. Section about 2740px tall, light.

| Element | Position / size | Style |
|---|---|---|
| Title block | positioned absolutely, 144px from the section top, left of center (heading at x 250) | round logo sticker above; `heading-xl` 96px, "ABCD" in the serif, "EF-TEAM" in the grotesk |
| Items | 6 portraits, 408 x 510 (34 x 42.5rem, 4:5) | no frame, no radius |
| Item layout | zigzag down the section: x 924, 120, 732, 48, 924, 120; each about 440px lower than the last | |
| Name lettering | painted over each photo in a bubbly hand-lettered style, bright color | part of the image in the reference |
| Stickers | 3 loose stickers (145 x 42, 168 x 46, 144 x 17), two rotated -10deg | |
| Closing link | centered near the bottom | serif "Ontdek meer over ons" with squiggle and double arrow |

The heading letters also react to the pointer (same weight effect as the banner).

## Skyline version

- Title: BRANDS WE'VE / *LAUNCHED*, with a round Skyline patch sticker above it.
- Items: one strong portrait crop (4:5) per project, 6 items, same zigzag.
- Names are not baked into the photos. Each item gets a hand-lettered SVG of the client's name laid over the image, so swapping the image for a Nova scene later (phase B) keeps the lettering. Lettering colors from the palette.
- Stickers: Less talk, more launches / Dallas, TX / Houston, we have a brand.
- Each item links to its project page.
- Link: See all work, `/work`.

### Phase B

Same layout, same lettering. The image for each client is replaced by Nova placed in that client's world. When most items are Nova scenes, the heading can switch to NOVA WAS / *HERE*. This is a content change in `src/content/home.ts`; no code changes.

## Content

- Heading: BRANDS WE'VE / *LAUNCHED*
- Items: `{ project, image, lettering, letteringColor }[]` in `src/content/home.ts` (`brands`)
- Stickers: 3 lines above
- Link: See all work, `/work`

## Assets

| Asset | Source | Status |
|---|---|---|
| 6 portrait crops, 4:5, 816 x 1020 or larger | From the project export | To produce |
| 6 hand-lettered client names, SVG | Authored (bubbly display lettering, single color fill) | To produce |
| 3 text stickers, SVG | Authored | To produce |
| Skyline round patch | Shared with part 03 | From part 03 |
| Nova scenes, 4:5 (phase B) | To produce later | Later |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Heading | section enters | Char reveal, then weight hover (grotesk 700 to 200, serif 300 to 800, radius 400px) | `expo.out`, 1s |
| Items | scroll through the section | Parallax: even items move down 80px, odd items move up 48px (80 x -0.6) across the section's time on screen; distance x1 desktop, x0.5 tablet, x0.3 mobile | linear, scrubbed |
| Lettering | item enters | Scales in with a small overshoot | `back.out(2.5)`, 0.6s |
| Stickers | pointer passes over a sticker | Knocked in the direction of the pointer's velocity (x and y up to 30x velocity, rotation from the pointer's angle up to 20x), then settle back with inertia | InertiaPlugin, resistance 200, clamped to ±1080px and ±60deg |
| Link | hover | Squiggle draws in | `power2.inOut`, 0.5s |

Reduced motion: no parallax, no inertia, lettering visible.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Heading`, `WeightHover`, `DrawLineLink`, `Sticker`, `Media` | reuse | | |
| `Parallax` | new | `distance` (80), `pattern` (`alternate`: 1 / -0.6), `scale` per breakpoint, `disableOn` | |
| `MomentumHover` | new | `strength` (30), `rotation` (20), `resistance` (200) | Wraps any element |
| `Lettering` | new | `svg`, `color`, `position` | Hand-lettered label over media |
| `ScatterLayout` | new | `items`, `positions` (preset zigzag), `itemSize` | Layout only; about page reuses it with office photos |
| `ProjectCard` | extend | `variant="collage"` | Image, lettering, link |

## Acceptance

- [ ] Zigzag positions and item sizes match the reference at 1440
- [ ] Parallax feels continuous, no snapping at section edges
- [ ] Swapping one item's image in content changes only that image (phase B check)
- [ ] Stickers settle back to their exact resting spot
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] Reduced motion and keyboard paths work
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
