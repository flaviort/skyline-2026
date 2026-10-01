# Part 05: What we do

Status: spec
Approved by / date:

Three tilted service cards that react to the mouse and play video on hover.

## Reference

Measured at 1440x900. Section about 920px tall, light.

| Element | Position / size | Style |
|---|---|---|
| Heading | centered, about 140px below section top, 505 x 79 | `heading-xl` 96px (8rem): grotesk "WAT WE" 500, serif "DOEN" |
| Card row | 1008px wide, centered, cards slightly overlapping | |
| Side cards | 327 x 488 (about 27 x 40.7rem), rotated -3deg (left) and +3deg (right) | solid color frame as 18px (1.5rem) padding: blue `#0038ff` and orange `#ff5f04` |
| Middle card | 302 x 473, raised about 14px, no tilt | pink `#ff77cd` frame |
| Card media | 287 x 351 on side cards (about 4:5) | still image with a video layered on top |
| Card text | under the media, inside the frame | title 60px (5rem) grotesk 700 uppercase; description 2 lines in the serif, centered |
| Link | centered under the row | serif "Ontdek meer" with squiggle and arrow chip |

The row uses the same focus-on-hover collage as part 03.

## Skyline version

- Cards: STRATEGY (orange frame), DESIGN (cobalt frame), SOCIAL (lilac frame). Middle card is DESIGN. (Q3, approved: the third pillar is Social.)
- Text on the frames: ink on orange and lilac, white on cobalt (Q17, Q18).
- Media (Q3, approved): Strategy = Think Apollo, Design = Airly 3D, Social = Dymatize social. Stills for now; they get replaced by animations later. A loop plays on hover where one exists.
- Link: "Discover more" to `/services`.

## Content

- Heading: WHAT WE *DO*
- STRATEGY: Digital strategy and SEO that aim the rocket somewhere worth going.
- DESIGN: Branding, UX and websites people actually remember.
- SOCIAL: Social campaigns, content and video that keep people watching and coming back.
- Link: Discover more, `/services`
- Source: `src/content/services.ts` (pillars, each listing its services)

## Assets

| Asset | Source | Status |
|---|---|---|
| 3 card stills, 4:5, 2x | Cut from the project export | To produce in this part |
| 3 hover loops, 4:5, under 1.5 MB each | From project videos where available | Optional |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Heading | section enters | Line reveal | `expo.out`, 1s |
| Cards | section enters | Rise into place in sequence | `expo.out`, 0.8s, 0.12s apart |
| Focus collage | hover a card (tap on touch) | As in part 03: focused card scales 1.075 and straightens, others shrink, move aside and tilt | `move`, 0.8s |
| Hover video | pointer enters a card | Video source loads on first hover and plays; on leave it pauses and rewinds after 200ms | immediate |
| Link | hover | Squiggle draws in | `power2.inOut`, 0.5s |

Touch: no hover video (the still stays), tap to focus. Reduced motion: static cards, no video autoplay.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Heading`, `ScrollReveal`, `Frame`, `Media`, `DrawLineLink`, `FocusCollage` | reuse | | |
| `Media` | extend | `play="hover"` with lazy source | Hover-to-play lives in `Media`, not in the card |
| `ServiceCard` | new | `service`, `frameColor`, `tilt`, `raised` | Reused on the services page |

After this part: run `/impeccable extract` (PLAN milestone) to catch duplication across parts 01 to 05.

## Acceptance

- [ ] Card sizes, tilts and overlap match the reference at 1440
- [ ] Frame text passes contrast on every frame color
- [ ] Hover video starts within a frame or two of hovering, with no layout shift from still to video
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] Reduced motion and keyboard paths work
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
