# Page: Services (`/services`)

Status: spec
Approved by / date:

The seven services in depth, grouped under the three pillars from the homepage.

## Reference (`/wat-we-doen`)

| Section | What it does |
|---|---|
| Hero | Serif lead ("Wat we doen") and headline ("Alles beweegt") with weight hover, one line of copy. Around it, a dozen stickers and small media cards travel on an elliptical orbit across the viewport; scrolling the wheel speeds the orbit up and spreads it out, then it eases back. |
| Statement | A large paragraph (serif, paragraph-xl) revealed line by line, plus a smaller supporting paragraph |
| Service steps | Split screen per service: left column scrolls through a serif intro line ("Hard story? Easy told.") and a huge grotesk service name with its text; the right half is a sticky color panel with media that changes per service (blue for animation, pink for video, and so on). Active step is the one closest to the viewport middle. |
| Contact CTA and footer | Shared |

Orbit settings in the reference: speed 3, horizontal spread 2.4, vertical spread 2.7, rotation up to 20deg; wheel adds acceleration (deltaY / 800) and spread (deltaY / 40), both easing back to 0 after 120ms.

## Skyline version

| # | Part | Content | Components |
|---|---|---|---|
| S1 | Hero | Lead: What we do / Headline: EVERYTHING *ORBITS* (copy to agree) / One line. Stickers, project thumbnails and Nova orbit around the headline, faster when you scroll. | `Heading`, `WeightHover`, `Orbit` |
| S2 | Statement | Large serif paragraph on how Skyline works across strategy, design and social | `ScrollReveal` |
| S3 | Pillar steps | Three steps (Strategy, Design, Social), each listing its services: Strategy = Digital Strategy, SEO; Design = Branding, User Experience, Web Development; Social = Digital Marketing, Media Production. Sticky color panel per pillar (orange, cobalt, lilac) with project media. | `StickySteps`, `Media`, `ServiceCard` content |
| S4 | Contact CTA and footer | Shared | `ContactCta`, `Footer` |

Legacy service descriptions (Web Development, User Experience, Digital Marketing) in `../skyline-2023/about.php` are the starting copy.

## Content

- `src/content/services.ts`: pillars, services, descriptions, media.

## Assets

| Asset | Source | Status |
|---|---|---|
| Orbit items: 8 to 12 stickers and thumbnails, Nova | Stickers from part 07, thumbnails from the export | Partly on hand |
| One strong media per pillar | Project export | To pick |

## Acceptance

Per part, as in `docs/specs/_TEMPLATE.md`. Plus: the orbit pauses off screen and stops for reduced motion.
