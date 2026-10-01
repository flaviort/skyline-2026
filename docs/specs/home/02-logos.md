# Part 02: Logos

Status: spec
Approved by / date:

The client logo band along the bottom edge of the banner viewport. It sits inside the banner section, so the first viewport shows both.

## Reference

Measured at 1440x900.

| Element | Position / size | Style |
|---|---|---|
| Band | full width, bottom of the 100svh banner, 132px tall (11rem) | no background, no border |
| Logo slot | 132 x 132 (11rem square), 60px gap (5rem), 192px pitch | logo image centered and contained, single ink color |
| Collection | 8 logos, 1536px wide, cloned for a seamless loop | |

## Skyline version

- Same band and slot size. Logos are single-color ink SVGs so the band reads as one quiet line under the headline.
- Minimum set: the 6 case clients (Airly, Dymatize, Think Apollo, Barker Wellness, Sophie Brussaux, Andrew Callaghan). More from the user as they are cleared.
- With fewer than 8 logos the collection is cloned more times so the loop never shows a gap at 1920 wide.

## Content

- Logos with names in `src/content/site.ts` (`clients: { name, logo }[]`).
- The band is a list labeled "Brands we've worked with"; clones are `aria-hidden`.

## Assets

| Asset | Source | Status |
|---|---|---|
| Client logos, SVG, single color, cleared for public use | User | Waiting |
| Fallback while waiting: client names set as text in the grotesk at logo size | Built in | Available |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Collections | always | Loop left: `xPercent` 0 to -100 on every collection, repeating | linear; duration = 20 x (collection width / viewport width) x speed factor (1 desktop, 0.5 under 991px, 0.25 under 479px) |
| Direction | scroll | Scrolling down plays forward; scrolling up reverses the loop (`timeScale` flips) | immediate |
| Scroll drift | scroll through the band | The whole track shifts sideways with scroll progress (scrubbed), a few vw across the band's time on screen | linear, scrubbed |

Reduced motion: static centered row, no loop. The loop pauses when the band is off screen.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Marquee` | new | `speed` (20), `direction`, `scrollReactive`, `scrollDrift`, `duplicates`, `label`, `children` | Generic; reused for project page marquee blocks later |
| `LogoItem` | new, small | `logo`, `name` | Or inline inside the logos part if it stays trivial |

## Acceptance

- [ ] Band height, slot size and gaps match the reference at 1440
- [ ] Loop is seamless at 1280, 1440 and 1920 (no jump when a collection wraps)
- [ ] Direction flips smoothly on scroll up
- [ ] Screen readers hear one list of client names, not the clones
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] Reduced motion shows a static row
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
