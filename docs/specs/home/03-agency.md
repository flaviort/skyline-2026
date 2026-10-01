# Part 03: Agency / about

Status: spec
Approved by / date:

Office photos on the left, the agency story on the right. No team content (D2).

## Reference

Measured at 1440x900. Section starts right after the banner, about 765px tall.

| Element | Position / size | Style |
|---|---|---|
| Large photo card | x 59, 85px below section top, 447 x 546 | white card (paper), about 12.5px padding all round, photo 422 x 521, rotated -3deg |
| Medium photo card | x 417, overlaps the large card's lower right, 309 x 375 | white card, 14px padding with a taller bottom margin (48px) like a polaroid, photo 281 x 314, rotated 4deg |
| Sticker | x 384, top edge of the collage, about 180 x 143 | illustrated sticker, sits above both cards |
| Text column | right half, centered on about x 1070 | |
| Serif lead | above the heading | two short lines, serif |
| Heading | 486px wide | `heading-l` at this width: 72px (6rem), grotesk line then serif line |
| Paragraph | 336px wide (28rem), 3 lines | `para-m` 15px, weight 500, tracking -0.04em |
| Button | 141 x 36 (3rem tall) | arrow chip 36 x 36 in the accent, label block with 12px side padding in the accent, white text 12px uppercase |

The collage is interactive, not draggable: hovering a card focuses it and the others make room.

## Skyline version

- Large card: office photo `agency-01.jpg` (portrait). Medium card: `agency-03.jpg`. Both as white polaroids.
- Sticker: a round mission patch with Nova (authored SVG plus the Nova render), sitting where the reference sticker sits.
- Right column copy from `docs/CONTENT.md`: lead, heading THE CREW / *BEHIND SKYLINE*, paragraph, "More about us" button to `/about`.
- Button colors: orange chip and orange label block with ink text and icon (Q17: nothing white on orange).

## Content

- Lead: Seasoned pros and sharp new minds, / one crew
- Heading: THE CREW / *BEHIND SKYLINE*
- Body: No bloated agency process. We're a tight crew of industry veterans and forward-thinking strategists who move fast, think with you and say it straight. We've been launching brands and multimillion-dollar portfolios for over ten years.
- Button: More about us, `/about`
- Source: `src/content/home.ts` (`agency`)

## Assets

| Asset | Source | Status |
|---|---|---|
| Office photos (2) | `public/images/legacy/agency-01.jpg`, `agency-03.jpg` | On hand |
| Nova mission patch sticker | Authored SVG with the Nova render | To produce |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Lead, heading, paragraph | section top reaches 85% of the viewport, once | Lines rise from `yPercent: 135`, masked | `expo.out`, 1s, stagger 0.07s; items in the group start 0.12s apart |
| Button | same trigger, last in the group | Rises 24px and fades in | `expo.out`, 0.8s |
| Collage focus | pointer over a card (tap on touch) | Focused card scales to 1.075 and straightens to 0deg. Neighbors scale down (about 0.9), get pushed sideways to clear the focused card plus a 1% gap, lean toward the vertical center (up to 15%), and take a random tilt within ±5deg, all weakening with distance | `move` ease, 0.8s, overwrite |
| Collage reset | pointer leaves the collage (tap outside on touch) | Every card returns to its resting position and tilt | `move`, 0.8s |
| Button hover | hover or focus | Label slides left by one button height and tilts -3deg with a squash, arrow chip swaps for an arrow that scales in at the end | translate and rotate 0.8s on the spring `linear()` curve; squash 0.15s; bounce back 0.45s |

Reduced motion: text visible, no focus animation (cards stay put), button hover changes color only.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Section`, `Lead`, `Heading`, `TextReveal` | reuse | | |
| `ScrollReveal` | new | `group`, `stagger`, `start` ("top 85%"), `mode` (`lines`, `chars`, `element`) | |
| `Button` | new | `href`, `label`, `icon`, `bg`, `fg`, `chipBg`, `chipFg`, `size` | Port of the reference hover, colors as palette props |
| `Polaroid` | new | `src`, `alt`, `tilt`, `caption`, `bottom` (`even`, `tall`) | Built on `Frame` with `color="paper"` |
| `Frame` | new | `color`, `thickness`, `tilt`, `aspect` | Shared by polaroids and every framed card later |
| `Sticker` | new | `src`, `alt`, `size`, `rotate` | |
| `FocusCollage` | new | `items`, `focusScale` (1.075), `restScale` (0.9), `maxTilt` (5), `duration` (0.8) | Replaces the `DragCollage` idea: the reference collage is hover-to-focus, not drag |

## Acceptance

- [ ] Collage and text column positions match the reference at 1440 within a few pixels
- [ ] Focus effect feels like the reference: no jitter moving between cards, clean reset on leave
- [ ] Tap to focus works on touch; keyboard users see a static collage and can reach the button
- [ ] Photos are sharp at 2x and lazy-loaded
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
