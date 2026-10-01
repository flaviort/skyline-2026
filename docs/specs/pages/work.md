# Page: Work (`/work`)

Status: spec
Approved by / date:

All projects in a three-column grid. Old `/projects` redirects here.

## Reference (`/werk`)

| Section | What it does |
|---|---|
| Header | Serif lead ("Ons werk") and a two-line headline ("Wat je ziet / is wat je krijgt"), text reveal on load |
| Grid | Three columns of white cards: image (about 4:5), client name in grotesk caps, services in the serif underneath. The middle column sits lower and moves 120px with scroll (parallax on every item where index % 3 is 1, desktop only). Video plays on hover. Hovering a card shows the cursor marquee pill with the project's service line. |
| Contact CTA and footer | Shared |

## Skyline version

| # | Part | Content | Components |
|---|---|---|---|
| W1 | Header | Lead: Every mission, / on the record / Headline: OUR *WORK* (copy to agree) | `Lead`, `Heading`, `TextReveal` |
| W2 | Grid | The 6 projects: cover still, client name, services line (from the export, for example "3D, Photography, Social, Website"). Middle column offset and 120px parallax on desktop. Hover loop where one exists. Cursor marquee shows the project subtitle. | `ProjectCard` `variant="grid"`, `Parallax` (grid mode), `Media` `play="hover"`, `CursorMarquee` |
| W3 | Contact CTA and footer | Shared | `ContactCta`, `Footer` |

With only 6 projects the grid is two rows of three; the offset middle column keeps it from looking like a spreadsheet.

## Content

- `src/content/projects/*` (export). Order set by an `order` field.

## Assets

- Covers from the export, cropped to 4:5 at 2x.

## Acceptance

Per part, as in `docs/specs/_TEMPLATE.md`. Plus: `/projects` returns a 308 to `/work`.
