# Part 11: Page transitions

Status: spec
Approved by / date:

The first-load reveal and the transition between pages: a thick hand-drawn stroke scribbles across the screen, covers it, then unwinds to reveal the next page.

## Reference

Built with Barba plus GSAP DrawSVG. The overlay is one SVG path in a fixed full-screen layer: viewBox 1000 x 1000, `preserveAspectRatio="none"`, round caps and joins, `currentColor` stroke. The path is a looping scribble that crosses the whole screen several times.

| Phase | What happens | Timing |
|---|---|---|
| First load | Page hidden. The stroke starts fully drawn (0% to 100%) at 30% stroke width, which covers the screen. At 0.4s the page becomes visible and the stroke unwinds (to 100% 100%) while thinning to 5% | unwind 1.25s `power1.inOut`; headline text reveal starts with a 0.6s delay |
| Leave | Stroke draws in from 0% to 85% while its width grows from 5% to 30%, covering the old page | draw 1s `power1.inOut`; width 0.75s from 0.25s |
| Swap | Old page fixed in place at its scroll position, new page mounted at the top, smooth scroll stopped and reset | |
| Enter | At 1s the new page is visible under the stroke; the stroke unwinds and thins | 1.25s `power1.inOut`; text reveal at +0.4s with a 0.3s delay; page ready at 2.25s |

Stroke color follows the page theme: dark stroke on light pages, light on dark ones. Reduced motion: no stroke, instant swap. Browser scroll restoration is manual so every page starts at the top.

## Skyline version

- Same choreography and timings. The scribble path is redrawn for Skyline as an orbit-like loop (same idea, our own path).
- Stroke color: orange on every page (Q4, approved).
- Next.js has no Barba. Internal links use a `TransitionLink` that plays the leave phase, then calls the router; the enter phase plays when the new route mounts. Back and forward buttons get the enter phase only (no leave), so history navigation never feels blocked.
- Text reveals, the weight effect and ScrollTriggers wait for the "page ready" signal from the transition, like the reference.

## Content

None. The path lives in the component.

## Assets

| Asset | Source | Status |
|---|---|---|
| Scribble path, 1000 x 1000 viewBox | Authored | To produce |

## Motion

As in the table above; tuned side by side against the reference in this part.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `PageTransition` | new | `color`, `path` | Fixed overlay in the root layout; exposes `leave()` and `enter()` and a ready event |
| `TransitionLink` | new | same props as Next `Link` | Every internal link in `Button`, `DrawLineLink`, `NavPill`, cards and the footer goes through it |
| `usePageReady` | new hook | | Lets `TextReveal`, `WeightHover` and scroll effects start at the right moment |

## Acceptance

- [ ] First load and every route change match the reference's feel and timing
- [ ] No flash of the new page before the cover is complete
- [ ] Back and forward work, including with a slow network (the transition waits for the route)
- [ ] ScrollTriggers from the old page are all killed; no pinned leftovers
- [ ] Reduced motion: instant, no stroke
- [ ] Keyboard focus moves to the new page's main heading after navigation
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
