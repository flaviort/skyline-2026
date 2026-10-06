# Part 01b: About, Nova lands

Status: review (round 2, the space journey, built 2026-10-05)
Approved by / date: round 1: user, 2026-10-05 (defaults taken on the open questions: part 03 stays, heading ABOUT, no wave after landing). Round 2: user, 2026-10-05 (defaults on the questions: no captions, about 4 screens, cast built in code).

## Round 2: the space journey (proposal, 2026-10-05)

User feedback on round 1: make it more interesting and creative. Between the banner and the landing, Nova stays sticky on screen and floats through a little piece of space while you scroll: a rocket, asteroids, stars, a UFO, a planet he circles. Then the frontflip and the landing in the middle of the page as built. Everything drifts like it is weightless. Scrolling back up returns him to his banner spot on the right.

### Art direction

- **Same world as Nova.** Chubby, rounded, toy-like shapes with soft bevels, no sharp edges, no realism. Glossy lacquer finish lit by Nova's own studio (the same lights and the same reflection map as his suit), so they read as one render with him.
- **Palette from the tokens:** off-white lacquer, orange `#ff4f00` accents, cobalt, lilac and visor yellow for color, ink for small details. Nothing outlined, no textures to download.
- **Built in code** (three.js shapes: spheres, capsules, rounded cones, tori, softly displaced blobs). Light, instant to load, and easy to tune. Each object is its own component, so the 3D designer can later swap any of them for a real model with the same name and placement.

### The cast

| Object | Look | Behavior |
|---|---|---|
| **Rocket** | Fat white body like a bowling pin, orange nose and three stubby orange fins, round cobalt porthole, a puffy exhaust of soft white and orange balls | Launches up from the bottom left past Nova; its wake nudges him into a slow tumble |
| **Asteroids** (5 to 7) | Lumpy warm grey potatoes with a few soft round craters, a couple tiny | Tumble slowly at different depths; one drifts right at him, he pushes off it with his feet and changes direction |
| **Planet** | Small lilac planet with an orange ring and one tiny moon | Nova orbits it once: he passes behind it (hidden by it, real 3D depth) and comes out the other side |
| **UFO** | Classic saucer, cobalt with a ring of little yellow lights, glass dome with a small chubby lilac alien inside | Hovers in, shines a soft cone of light on Nova that lifts him a bit, the alien waves, Nova waves back, it zips off |
| **Stars** | Chubby four-point sparkle stars in yellow and white, plus the existing star field behind | Twinkle and slowly turn, scattered at depth so they parallax past |

### The beats (one scroll timeline, about 4 screens long)

The banner scrolls away as now; under it, a tall sticky scene keeps the canvas in place while scroll drives the story. Every beat overlaps the next, so it reads as one flowing drift, never as slides.

| Scroll | What happens |
|---|---|
| 0 to 10% | Banner leaves. Nova lets go of the mouse and drifts toward the middle-right. Stars begin to slide up past him (we are falling down through space). |
| 5 to 25% | **Rocket** blasts up from the bottom left, passes him, its exhaust puffs swirl around him; he spins a quarter turn in the wake. |
| 20 to 45% | **Asteroid field.** Rocks drift up from below at three depths. One heads straight at him: he tucks, plants his feet on it and kicks off to the left, the rock spins away. |
| 40 to 65% | **Planet.** It rises into view; Nova arcs around it, behind and out the other side, looking at it as he goes. Its moon passes in front of the camera. |
| 60 to 82% | **UFO.** It slides in from the right, beams him up a little, the alien waves, Nova waves back. The UFO zips off the top with a stretch. |
| 80 to 100% | Space clears. Nova moves to the center, does the **frontflip** and **lands** on the about section as in round 1, then rides off with it. |

All objects move with a lag behind the scroll (like `scrub: 3`) and keep their own slow drift and spin even when the scroll stops, so the scene never freezes. Nova keeps his bob, drift and loose limbs throughout.

### Scrolling back up

Everything plays in reverse. When he gets back into the banner he heads to his home spot, **vertically centered on the right**, and only starts wandering again after a short pause there (today he returns to wherever his wander path happened to be, which can look like the center).

### Optional: mission log captions

Small readout-style captions (the same type as the banner's coordinates) could label each beat at the edge of the screen, like a flight log: for example "T+00:04 Liftoff", "T+00:11 Asteroid field", "T+00:19 Orbit", "T+00:26 Close encounter". They make the journey feel deliberate and on brand, but they are new copy, so only if you want them.

### Performance and fallbacks

- One canvas, as today. Objects are simple shapes sharing a handful of materials; the scene renders only while the journey or Nova is on screen.
- Phones: fewer asteroids and stars, smaller objects, the same beats. Full tuning in part 10.
- Reduced motion: no sticky scroll and no journey. The about section shows the still Nova on the heading, as in round 1.
- No 3D: same as reduced motion.

### As built (round 2)

- Timeline: `src/components/three/space-journey.ts`, pure functions of the journey progress `j` for Nova's path and cues (spin in the rocket's wake, tuck and kick off the rock, the orbit in depth around the planet, looking at each object, waving at the alien) and for every object. Tune beats there.
- Cast: `src/components/three/space-cast.tsx`, one builder per object (rocket, potato asteroids with craters, planet with ring, spots and moon, UFO with chasing lights, alien and a fading tractor beam, extruded sparkle stars). Lacquer objects share Nova's suit reflections; the rocks are matte clay.
- Scroll: `#journey` in `src/app/page.tsx` is 400svh of scroll room (`.space-journey`, 0 with reduced motion or the still Nova). In the stage, one smoothed scroll distance drives three phases: `enter` (the banner's first 60%), `j` (from 45% of a screen to the last 1.1 screens), `p` (the landing as in round 1).
- Nova shrinks to `JOURNEY_SIZE` (0.72) for the journey, then to `LANDING_SIZE` (0.6). He can move in depth (the orbit), so his place is set in world space from screen fractions and depth (`toWorld`).
- Back in the banner he returns to his home spot (vertically centered, middle of his band on the right) and waits 1.6s before wandering or following the pointer.
- The Scroll button now goes to `#journey`.

### Review tweaks (2026-10-05)

User: the vibe is Despicable Me (Illumination), polished and characterful, not childish. Applied:
- Rocket: slim body, pointed nose, sharp swept fins; it now flies on until its smoke is off the top (the trail was still showing at the end).
- Nova stays full size on the journey; he shrinks (`ORBIT_SIZE`, 0.72) only while circling the planet.
- Asteroids: about 18 craters each, a few big and many small.
- Stars: self-lit with a pulsing glow and four-point flare, and a much wider spread of sizes. A second set (`LANDING_SPARKLES`) pops in around the about text as Nova lands and rides with it (only the ones above the heading on phones, where the text fills the width).
- Planet: bigger, a generated banded violet surface with a storm and cratered bump map, a layered orange ring system (narrowed so his orbit clears it), a violet atmosphere glow and two moons. His orbit is tilted against the ring: over the top behind the planet, lower in front.
- UFO: chrome trim and rivets, glowing chasing lights, an engine ring underneath, an antenna with a blinking red tip like Nova's. It swoops in banking into the turn, spins up and jitters while beaming, crouches, then stretches as it zips off. The alien is green (`--color-alien`), with big eyes under heavy lids, blinks, and waves with a hand.

### Second review round (2026-10-05)

- Stars: down to six hand-placed ones on the journey (four on phones) and three around the about text. They keep drifting up through the landing (`sparkleAt` takes `j + p * 0.4`) instead of all disappearing when the landing starts, which is what made them vanish at once.
- UFO: the shaking came from changing its spin speed mid-flight (the angle jumped) and a deliberate jitter while beaming. Spin, bank and climb are now integrated and smoothed frame to frame, the jitter is gone, the lights chase at a steady speed, and its path takes longer (it enters at `j` 0.56 and leaves by 0.97).
- Planet: no storm oval and no clearcoat; a satin surface with soft craters.
- Asteroids: rebuilt as chiselled rocks: flat cuts break the round outline, sharp-rimmed craters with dark floors, flat-shaded facets coloured per face.

### Phone tilt (2026-10-05)

On touch screens the phone's tilt plays the pointer's part (`src/lib/tilt.ts`). Readings are relative to how the phone is held: the resting angle catches up over about 4 seconds, so only movement counts. In the banner Nova floats toward the tilt, leans into it and looks that way; on the journey the scene slides against the tilt with depth parallax (near objects more) and he shifts a little; after landing his head follows it. Android starts right away. iPhones show Safari's motion permission prompt on the first tap that is not on a link or button (user's choice); if declined, nothing changes.

### Questions (answered with defaults)

1. **Captions:** add the mission log captions, or keep the journey wordless?
2. **Length:** about 4 screens of scroll feels right for five beats. Shorter (3) is snappier, longer (5) is more relaxed.
3. **Models:** build the cast in code now (my pick), or would you rather the 3D designer models them first (the code version would then be a placeholder)?

## Round 1

The first section under the banner. A change of direction from the reference (user, 2026-10-05): instead of extrafazant's agency collage, this section brings back the old site's best moment, where the 3D S spun and landed in the middle of the screen as you scrolled. Here Nova does it. Part 03 (the crew and office photos) follows after it.

## Reference: the old site (skyline-2023)

Measured from `../skyline-2023/assets/js/functions.js` (around line 460) and `assets/scss/pages/home.scss` (`#about`).

| Element | What it does |
|---|---|
| 3D S | On a fixed full-screen canvas. Over the first 100vh of scroll it moves from the right of the banner to the center (`x: 0`); over 300vh it shrinks to 0.65 and spins 7 radians on z. All scrubbed with `scrub: 3`, so it trails the scroll and eases to a stop. |
| About section | 100vh tall, everything centered: small muted uppercase title, a huge one-word heading, a paragraph 65rem wide at `text-big`, a hollow button. Lines reveal by characters from `y: 100%` when they reach 75% of the viewport. |

## Skyline version

- **Nova stays fixed on the screen** (he is already on a fixed canvas). Scrolling out of the banner no longer floats him up and away. Instead:
  1. **Release.** As the banner starts to leave, he stops wandering and following the mouse, and the "Nova / EVA-01" tag fades out.
  2. **Travel and frontflip.** He moves from wherever he is to the horizontal center of the screen, slightly above the vertical middle, and does one full **frontflip** on the way (head goes forward and down, knees tucked at the top of the turn, body opens up again on the way out). A backflip already exists as a trick; this is its mirror, scrubbed by the scroll.
  3. **Landing.** He comes out of the flip upright, facing the visitor, legs reaching down, and touches down: a small knee bend that springs back, arms out a little for balance, antenna wobble. Then he settles, still breathing, with only his head following the mouse.
- **He stops on top of the text.** While the section scrolls up, Nova holds his spot in the middle of the screen. When the top of the heading reaches his feet, he "stands" on it and from then on scrolls away with the section, like any element on the page. Scrolling back reverses everything: he lifts off the heading, flips backwards out of the landing, and returns to floating in the banner.
- **Always floating** (user, 2026-10-05). Nothing about him is ever static: during the travel, the flip and after the landing he keeps his zero-g bob, slow drift and loose limbs. The landing is a soft touchdown in zero gravity, and on the heading he hovers just above it, bobbing a little, rather than standing rigid.
- The whole choreography is scrubbed with a smoothing lag like the old `scrub: 3`, so a fast flick of the wheel never makes him jump.
- **Size:** he lands at about 70% of his banner size, so he reads as a character standing on the headline, not covering it.
- **Section layout** follows the old one, centered, on the ink ground: muted eyebrow, very large one-word heading, paragraph, button. The section is at least 100vh with the heading block placed low enough (top of the heading around 58% of the viewport when the section is centered) that Nova's landing spot and the heading meet naturally.
- He never covers the paragraph or the button (the existing "never settle over a link" rule still applies; on top of the heading his feet sit just above the cap height).

## Content

Same words as the live site today (legacy copy, so no new approval needed, but listed in `docs/CONTENT.md`):

- Eyebrow: About Skyline
- Heading: ABOUT
- Paragraph: Through expert strategy and genius thinking, we launch and **grow brands**, both national and global, as well as help startups that need to punch above their weight.
- Button: Get to Know Us, to `/about`
- Source: `src/content/home.ts` (`about`)

## Assets

| Asset | Source | Status |
|---|---|---|
| Nova model | `public/models/nova.glb` | On hand |
| Nova still (fallback when 3D is off) | `public/images/legacy/nova.png` | On hand |

No new media.

## Motion

Scroll progress `p` runs from the banner's top leaving the viewport (0) to the section's heading reaching the landing spot (1).

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Nova release | `p` 0 to 0.12 | Wander and mouse follow fade out, tag hides, idle tricks stop being scheduled | smoothed with the scroll |
| Nova travel | `p` 0.05 to 0.75 | From his current spot to the landing spot (center x, about 42% of the viewport height); scale to 0.7 | `power2.inOut` along the scroll, then damped (scrub-like lag, about 0.6s) |
| Nova frontflip | `p` 0.15 to 0.7 | One full forward turn (pitch +360deg) with the tuck at the top, like the backflip trick mirrored | `power2.inOut` |
| Nova landing | `p` 0.7 to 1 | Legs extend down, knees bend on contact and spring back, arms out then relax, antenna springs | existing bone springs |
| Nova on the heading | heading top reaches his feet | Locks to the heading and scrolls off with the section | none (rides the page) |
| Eyebrow, heading, paragraph | each line at 85% of the viewport, once | Masked line reveal, the same as the banner (`useKineticText`), heading keeps the cursor weight effect | `expo.out`, 1s, stagger 0.07s |
| Button | after the paragraph | Rises 24px and fades in | `expo.out`, 0.8s |

Rendering stops once Nova has scrolled off the top with the section (it currently stops when the banner leaves).

**Reduced motion:** no flip and no travel. Nova fades out in the banner and fades in already standing on the heading. Text is visible without the reveal.

**No 3D (fallback):** the Nova still sits in the page flow on top of the heading, so the section looks the same without WebGL.

**Below 992px:** same choreography, smaller Nova, landing spot adjusted so he stays above the heading. Full tuning in part 10.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Section`, `Heading` | reuse | | Heading as one bold line |
| `useKineticText` | reuse | | Same reveal as the banner |
| `NovaLayer`, `NovaStage` | extend | `landingSelector` (element he lands on), replaces the scroll-out with the landing choreography when given | The scroll-out code becomes one scroll timeline: release, travel, flip, land, ride |
| `nova-tricks.ts` | extend | `frontflip` | Also available as a button in the `/lab` Nova box |
| `Eyebrow` | new | `as`, `className` | Small muted uppercase label; reused by later sections |
| Button | decide in the lab | | Either `PillButton` (menu Contact style) or the `Button` planned in part 03. My pick: build part 03's `Button` now and use it here, so both sections share one |
| `AboutSection` | new | | `src/components/sections/home/about.tsx`, replaces the placeholder in `src/app/page.tsx` |

Lab: the about section with Nova on its own page-mode canvas, plus a "frontflip" trick button in the Nova box.

## Open questions

1. **Overlap with part 03.** This section ("Get to Know Us" to `/about`) and part 03 ("The crew behind Skyline", "More about us" to `/about`) both introduce the agency and both link to the About page. Keep both, or fold part 03's office photos and copy into the About page and go straight from here to Recent projects?
2. **Heading.** Keep the one word ABOUT as today, or a two-line heading in the site's style (bold line plus hairline accent line), for example ABOUT / *SKYLINE*? The eyebrow would then go.
3. **After landing.** Once he stands on the heading, should he do anything (a small wave the first time he lands), or just stand and look at the mouse?

## As built (2026-10-05)

- Landing spot: `[data-nova-landing]` in `src/components/sections/home/about.tsx`, sized from his height (`--nova-h`, set by `NovaLayer`) times `LANDING_SIZE` (0.6) plus room for his float. Its parent block (spot, eyebrow, heading, paragraph, button) is what ends up centered on screen when he lands; he holds there until the spot arrives, then rides it.
- Choreography in `nova-stage.tsx` (the landing block): progress is the scroll distance from the top of the banner over the distance until the spot reaches its hold position, smoothed with `LANDING_LAG` (3.5). Travel 0.05 to 0.75, frontflip 0.15 to 0.7 with a tuck, touchdown 0.82 to 1 (knees, hips, arms out). Bob, drift, swim kick and antenna keep running the whole time, a bit calmer once landed; his limbs drag from his actual on-screen motion, so riding off the top also trails them.
- Landed, he stops following the pointer but keeps watching it (head and a little of the body). Tricks stop while he leaves the banner; clicks do not start one.
- The button is the menu's `PillButton` in a new orange, large variant. Text reveals start on scroll (`reveal.scroll` in `useKineticText`).
- Fixed on the way: Nova vanished when you scrolled back to the banner after he had left the screen (the canvas clock restarts when rendering resumes, which replayed the entrance hidden). He now runs on his own clock.

## Acceptance

- [ ] Nova travels, frontflips once and lands upright in the center without popping, at any scroll speed, in both directions
- [ ] He stops exactly on the heading's top edge and then scrolls with it, with no slide or jitter at the hand-off
- [ ] Scrolling back up returns him to his normal banner behavior
- [ ] Never covers the paragraph or the button
- [ ] Rendering stops once he is off screen
- [ ] Reduced motion and no-WebGL paths look complete
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
