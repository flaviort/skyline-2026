# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) with TypeScript and Tailwind CSS 4, chosen by the user. Animation runs on GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG, Inertia, CustomEase) with Lenis for smooth scroll. Fully static: no WordPress, no database. Deployed on Vercel by the user. Domain: https://theskylineagency.com (currently still serving the old site).

## Users

Marketing leads, founders and business owners, mostly in the US, who are shopping for an agency to launch or grow a brand. They arrive from referrals, search ("Dallas digital marketing agency") or social, usually on desktop during work hours, sometimes on a phone. Their job on the site: decide within a minute whether Skyline is good enough and close enough to their problem to start a conversation.

## Product Purpose

The Skyline Agency LLC is a full-service digital agency born in Dallas, TX. It launches and grows brands, national and global, and helps startups that need to punch above their weight. The website exists to turn a visitor into a new-business conversation (contact form, email or call). Success means more qualified inbound leads and a site that proves the team's craft by being well made itself.

## Positioning

A Dallas agency run by industry veterans and younger strategists that covers the whole growth path in one team: strategy, brand, web, UX, marketing, SEO and media production. The house metaphor is the space mission: brands grow "astronomically", and the agency's mascot is Nova, a white-suited astronaut.

## Operating Context

- Services (unchanged from the previous site): Digital Strategy, Branding, Web Development, User Experience, Digital Marketing, SEO, Media Production.
- Contact: accounts@theskylineagency.com, +1-972-861-0416, 1529 Dragon St, Dallas, TX 75207.
- Social: Instagram, Facebook, X/Twitter, LinkedIn, Behance (URLs in the legacy `components/atoms/globals.php`).
- A capabilities deck PDF (2023) exists in the legacy site.
- Language: English only. The reference site is Dutch; none of its copy is used or translated.
- Portfolio: 6 case studies from the old WordPress (Andrew Callaghan, Barker Wellness, Airly, Sophie Brussaux, Think Apollo, Dymatize), rich in stills and case copy, lighter on video.

## Capabilities and Constraints

- Scope right now: the homepage, built one part at a time with user approval per part. About, Work, Project, Services, Contact, legal and 404 pages follow under the same rule.
- The homepage layout, motion, spacing and type rhythm follow extrafazant.nl closely, by explicit user request. Its assets, copy, logo, fonts and code are not reused; every pattern is rebuilt for Skyline.
- Fonts: free, self-hosted stand-ins chosen by side-by-side match Inter Tight (for Helvetica Now), variable 100 to 900 so the cursor weight effect works. Sans only since 2026-10-01: the reference's serif line is a hairline Inter Tight accent line. Swappable if licenses are bought later.
- No team section and no team photos; the site talks about the agency and the office instead.
- Undecided: custom cursors, analytics provider, contact form email provider and spam protection.

## Brand Commitments

- Name: The Skyline Agency (short: Skyline). Logo wordmark and "S" mark from the legacy site (`public/brand/`).
- Astronaut theme stays. Nova, the 3D white-suited astronaut (`public/images/legacy/nova.png`), is the mascot. A rigged 3D model of Nova (with skeleton) exists from Skyline's 3D designer; on the homepage he floats in the banner and follows the mouse, rendered live with three.js.
- Accent color: international orange `#ff4f00`.
- Direction: dark. The project started with a white direction; after the first banner review (2026-10-01) the user switched the whole site to an ink ground with off-white text. Light stays available for individual sections.
- Voice: confident, a little playful, plain English. The old site's "We grow brands astronomically" line is a keeper.

## Evidence on Hand

- User will supply: client logos cleared for public use. Project material comes from a one-time export of the old WordPress.
- On hand: Nova render (`public/images/legacy/nova.png`), three photos of the Dallas office (`public/images/legacy/agency-0*.jpg`), legacy reel video (`skyline-2023/assets/videos/skyline-reel.mp4`, 17 MB), legacy copy.
- Not available: team photos (and no team section planned). No testimonials, awards, client counts or results figures have been provided; none may be invented.
- Approved gap-filler: original astronaut art may be generated, labeled as placeholder until the user approves each piece.

## Product Principles

1. Show the work before describing it. Real projects carry the page; adjectives do not.
2. Every claim is a fact Skyline can back. No invented metrics, clients or quotes.
3. The site is the portfolio piece: motion and detail at studio level, with no jank on a mid-range laptop.
4. One clear next step everywhere: start a conversation.
5. The space theme is flavor, not noise. It lives in Nova, the wording and a few details, never in a dark starfield cliché.

## Accessibility & Inclusion

WCAG 2.2 AA. Every animation respects `prefers-reduced-motion`; content is visible without JavaScript-driven reveals; body text never renders below 14px despite fluid scaling; all interactions work by keyboard.
