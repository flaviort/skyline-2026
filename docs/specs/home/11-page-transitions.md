# Part 11: Page transitions

Status: 11a intro: review (spec approved by the user 2026-10-05, built the same day); 11b route transitions: on hold
Approved by / date: 11a spec, user, 2026-10-05

Two pieces, built separately. **11a, the intro** (pulled forward by the user on 2026-10-05): what plays on every full page load. **11b, route transitions** between pages: on hold, to be defined later; the scribble-stroke draft below is kept for the record but is no longer the plan for the first load.

## 11a: Intro (first load)

### Reference

The user's reference is a Codegrid tutorial (YouTube `9vrLnWhtlBI`) rebuilding the intro of good-fella.com. Measured on good-fella.com itself, headless Chrome at 1440x900, screencast frames (times from navigation):

| Time | What happens |
|---|---|
| 0 to 0.9s | Solid orange screen (their orange is almost exactly ours). |
| 0.9 to 2.9s | Centered, tiny: a "LOADING" label types in letter by letter, and above it four small ink squares fill one at a time. The first flips open from a thin edge (a 3D turn on its left side); each next one starts on top of the one before and rolls over its bottom-right corner into the next slot, like a die (re-measured at full resolution on 2026-10-05). |
| 2.9 to 3.05s | The loader fades out. |
| 3.0 to 3.75s | **The sweep.** The orange panel is cut away by one straight diagonal edge: the bottom-left corner stays put while the top-left corner slides along the top edge to the top-right, then down the right edge to the bottom-right, like a clock hand wiping the orange off. One `clip-path` polygon, ease in-out, about 0.75s. Ink ground underneath. |
| 3.9 to 5.5s | Hero build. Header in first. Each headline line is revealed by blocks: an off-white bar grows across the line with an orange block chasing its leading edge, the bar retracts and leaves the text, ending on an orange caret that blinks out. Body copy and buttons fade up underneath; the hero image (an ASCII portrait) paints in. |

### Skyline version

Same structure and timing feel, rewritten as a launch countdown.

- **Plays on every full page load** (user, 2026-10-05), on any page, since it lives in the root layout. Client-side navigation does not replay it (that is 11b).
- **Countdown instead of "Loading."** The four squares become four stage lights. Under them, in small uppercase Inter Tight with tabular figures: `T-minus` types in, then each light lands together with its number on the same frame (`04`, `03`, `02`, `01`; user, 2026-10-05), then the label switches to `Liftoff` for one beat and the sweep starts. Ink on orange (Q17). No monospace: the site is sans only (D15).
- **The countdown is real, not a timer.** Each tick is a loading milestone, so the count only moves when something has actually happened:
  1. fonts ready (`document.fonts.ready`)
  2. window `load` (images and styles)
  3. Nova's model downloaded, on pages that have Nova (on other pages, or when Nova will fall back to the still image, this tick passes at once)
  4. the app hydrated and one frame painted
  Ticks always play in order, with a minimum of 0.35s each so a fast connection still reads as a countdown (about 1.7s from the first light to the sweep). If something is slow, the count waits on that light; after 5s total it finishes anyway and the page catches up behind the ink, so nobody is held on orange.
- **The sweep:** the reference's motion as it is, on our orange, revealing the ink banner. 0.75s, in-out ease from our tokens.
- **Banner build after the sweep.** This becomes the banner's one entrance, replacing its current first-load reveal. It is the same entrance whether the page was opened directly (intro) or reached through a route transition (11b), so it is written once and both play it:
  - Menu fades in from the top.
  - Block reveal on both headline lines: "We launch", then the first word of the list. Off-white bar, orange block on its leading edge, bar retracts, text stays. The second line ends on the caret we already have, which carries straight on into the word swap.
  - Readout, intro line and the Scroll button fade up in a short stagger.
  - Stars fade in.
  - Nova starts his entrance as the sweep ends. His model is already loaded (milestone 3), so there's no pop-in later.
- **One entrance signal, two sources** (user, 2026-10-05: the banner animation is tied to both the intro and the page transition). The cover leaving the screen is the cue, whichever cover it is:
  - the intro fires it when the sweep starts;
  - 11b's enter phase will fire it when its cover starts to leave;
  - a page with no cover (reduced motion, no JavaScript) fires it straight away.
  The signal is `whenPageReady()` in `src/lib/page-ready.ts`, already used by the headline, the word swap and Nova. It changes from a one-time promise to a per-page one: reset when a route starts leaving, resolved when the next page's cover starts to leave. The cue also carries the cover's timing (when it will be fully gone), so entrances can overlap the end of the sweep instead of waiting for it.
  Each page owns its entrance as one GSAP timeline (`usePageEntrance`), started by that signal. The banner's timeline is the build above; internal pages will write their own. The intro and 11b don't know what any page does, and pages don't know which cover just left.
- **Scroll is locked** while the overlay is up (Lenis stopped, native scroll blocked) and released when the sweep starts.
- **No flash:** the overlay is in the server HTML and visible from the first paint, and it only shows when the inline `js` class is on `<html>` (the existing pattern), so without JavaScript there's no overlay and the page simply shows.
- **Reduced motion:** no overlay, no countdown; the page appears as it does today.
- **Accessibility:** the overlay is `aria-hidden`; the page underneath is the real document from the start, so screen readers aren't blocked. Focus isn't moved.

### Content

New copy, waiting for approval in `docs/CONTENT.md`: `T-minus 04` / `03` / `02` / `01`, then `Liftoff`. Lives in `src/content/site.ts`.

### Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Stage light (x4) | its milestone, min 0.35s apart | first: flips open from its left edge (rotateY -90 to 0); others: roll out of the previous light over its bottom-right corner (rotate -90 to 0). The number lands on the same frame the light settles | 0.32s; flip power2.out, roll power2.inOut |
| Countdown number | with each light | old number slides up and out, new one in (masked) | 0.25s |
| `Liftoff` | 0.6s after `T-minus 01` has landed (user, 2026-10-05) | replaces the number, holds one beat | hold 0.3s |
| Stage lights out (user, 2026-10-05) | after the `Liftoff` hold | left to right, 0.07s apart: each swells to 1.15, then shrinks to nothing with a 30 degree twist | 0.1s out, 0.25s back-in |
| Loader | before the sweep | fades out | 0.15s |
| Orange panel | after the loader | clip-path sweep: top-left corner along the top edge, then down the right edge; bottom-left fixed | 0.75s in-out |
| Menu | sweep end | fades and drops in | 0.5s |
| Headline lines | sweep end, 0.15s apart | block reveal (bar grows with orange block on its edge, retracts) | about 0.9s per line |
| Readout, intro, Scroll | after the headline | fade up, staggered | 0.5s, 0.08s stagger |
| Stars | sweep end | fade in | 0.8s |
| Nova | sweep end | existing entrance | as in part 01 |

Reduced motion: no intro at all.

### Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `LaunchIntro` | new | none | Fixed overlay in the root layout: orange panel, four lights, countdown label; runs the milestones and the sweep |
| `src/lib/intro.ts` | new | | Milestone registry: pages can add one (Nova adds "model loaded"); the intro waits for all of them |
| `whenPageReady` | extend | | Per page instead of once: resolved by whichever cover is leaving (intro sweep now, 11b later), reset on route leave; passes the cover's remaining duration |
| `usePageEntrance` | new hook | | A page's entrance timeline, built paused and played on `whenPageReady`; killed on unmount. The banner uses it for menu, headline, readout, intro, Scroll, stars and Nova |
| `BlockReveal` | new | `delay`, `color` | Bar-and-block line reveal; reusable for other headlines later |
| `WordSwap` | extend | `reveal` | Uses `BlockReveal` for its first word on the intro load |
| `NovaLayer` | extend | | Starts the model download early and reports the milestone |

`LaunchIntro` and `BlockReveal` get `/lab` entries with a replay button and a "slow network" toggle.

### Acceptance

- [ ] Plays on every full page load; does not replay on client-side navigation
- [ ] Orange from the very first paint, no flash of the page before it
- [ ] Countdown ticks track real milestones; never finishes before the page is ready, never holds longer than 5s
- [ ] Sweep matches the reference's feel and timing
- [ ] Banner build and Nova's entrance start from the sweep, not before
- [ ] The banner's entrance is one timeline started by the shared signal, with no intro-specific code in the banner, so 11b can trigger it unchanged
- [ ] Scroll locked during the intro and released at the sweep
- [ ] No JavaScript: no overlay. Reduced motion: no intro
- [ ] Holds up at 1440, 1280, 992 and 390
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user

## 11b: Route transitions (on hold)

Earlier draft, written before the intro reference. To be redefined. Fixed already: its enter phase resolves `whenPageReady()` for the new page, so every page's entrance (the banner's included) plays after a route change exactly as after the intro. Otherwise open; the user's esfera project (`next-transition-router`, stacked color panels) and a reverse of the intro sweep are both options.

### Reference (draft)

Built with Barba plus GSAP DrawSVG. The overlay is one SVG path in a fixed full-screen layer: viewBox 1000 x 1000, `preserveAspectRatio="none"`, round caps and joins, `currentColor` stroke. The path is a looping scribble that crosses the whole screen several times.

| Phase | What happens | Timing |
|---|---|---|
| First load | Page hidden. The stroke starts fully drawn (0% to 100%) at 30% stroke width, which covers the screen. At 0.4s the page becomes visible and the stroke unwinds (to 100% 100%) while thinning to 5% | unwind 1.25s `power1.inOut`; headline text reveal starts with a 0.6s delay |
| Leave | Stroke draws in from 0% to 85% while its width grows from 5% to 30%, covering the old page | draw 1s `power1.inOut`; width 0.75s from 0.25s |
| Swap | Old page fixed in place at its scroll position, new page mounted at the top, smooth scroll stopped and reset | |
| Enter | At 1s the new page is visible under the stroke; the stroke unwinds and thins | 1.25s `power1.inOut`; text reveal at +0.4s with a 0.3s delay; page ready at 2.25s |

Stroke color follows the page theme: dark stroke on light pages, light on dark ones. Reduced motion: no stroke, instant swap. Browser scroll restoration is manual so every page starts at the top.

### Skyline version

- Same choreography and timings. The scribble path is redrawn for Skyline as an orbit-like loop (same idea, our own path).
- Stroke color: orange on every page (Q4, approved).
- Next.js has no Barba. Internal links use a `TransitionLink` that plays the leave phase, then calls the router; the enter phase plays when the new route mounts. Back and forward buttons get the enter phase only (no leave), so history navigation never feels blocked.
- Text reveals, the weight effect and ScrollTriggers wait for the "page ready" signal from the transition, like the reference.

### Content

None. The path lives in the component.

### Assets

| Asset | Source | Status |
|---|---|---|
| Scribble path, 1000 x 1000 viewBox | Authored | To produce |

### Motion

As in the table above; tuned side by side against the reference in this part.

### Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `PageTransition` | new | `color`, `path` | Fixed overlay in the root layout; exposes `leave()` and `enter()` and a ready event |
| `TransitionLink` | new | same props as Next `Link` | Every internal link in `Button`, `DrawLineLink`, `NavPill`, cards and the footer goes through it |
| `usePageReady` | new hook | | Lets `TextReveal`, `WeightHover` and scroll effects start at the right moment |

### Acceptance

- [ ] First load and every route change match the reference's feel and timing
- [ ] No flash of the new page before the cover is complete
- [ ] Back and forward work, including with a slow network (the transition waits for the route)
- [ ] ScrollTriggers from the old page are all killed; no pinned leftovers
- [ ] Reduced motion: instant, no stroke
- [ ] Keyboard focus moves to the new page's main heading after navigation
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
