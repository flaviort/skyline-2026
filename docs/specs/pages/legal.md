# Pages: Privacy (`/privacy`), Terms (`/terms`) and the cookie banner

Status: review (built 2026-10-08; copy reworked in a playful voice at the user's request, see docs/CONTENT.md)
Approved by / date:

## Reference

Plain rich-text pages in the site's type: a headline, then long-form text in a single readable column. Menu, CTA and footer as usual.

## Skyline version

| # | Part | Content | Components |
|---|---|---|---|
| L1 | Header | Headline (PRIVACY / *POLICY*, TERMS OF / *USE*) and a "last updated" date | `Heading` |
| L2 | Body | Long-form text, 65 to 75 characters per line, headings and lists styled from the type scale | `Prose` (one component for all rich text, reused by project text blocks) |
| L3 | Footer | Shared, without the big CTA | `Footer` |

## Cookie banner and preferences (Q11, approved)

Ported from the banner on igethi.com (the user's own Shopify build, `../igethi-shopify-theme/snippets/cookie-banner.liquid` and `src/js/_cookie-banner.js`), minus the Shopify-specific parts, restyled in Skyline's language.

**Banner.** Fixed to the bottom of the screen on first visit. Title, one line of copy, a link to the privacy policy, and three buttons: Essential only, Cookie preferences, Accept all. The page reserves space for it so it never covers the footer's last links (including Nova's goodbye spot).

**Preferences dialog.** Opened from the banner or from a "Cookie preferences" link in the footer bottom bar at any time. Switches:
- Essential: always on (security, remembering this choice).
- Preferences: remember site settings.
- Analytics: understand how the site is used.
- Marketing: ads and attribution.
- Do not sell or share: opt out of selling or sharing data with third parties (US state privacy laws).

Buttons: Essential only, Save preferences.

**Privacy signals.** If the browser sends Do Not Track or Global Privacy Control, the site sets essential-only automatically and the banner says so, with a single "Got it" button.

**Storage and wiring.** The choice is saved in `localStorage` under a versioned key (`skyline-cookie-consent`), and a `cookie:consent` event tells the rest of the site. Analytics and marketing scripts load only after consent (Google Analytics with Consent Mode defaults set to denied, if GA stays). No script that sets non-essential cookies runs before the visitor chooses.

**Why opt-in.** Analytics and marketing stay off until the visitor says yes. That is what GDPR requires for visitors from the EU and the UK, and it is also the strictest US expectation, so one behavior covers everyone (igethi works the same way).

**Copy (adapted from igethi, to confirm).**
- Title: Cookies
- Body: We use essential cookies to run the site. Analytics and marketing cookies stay off until you choose them.
- Do Not Track title and body: Do Not Track / Your browser asked us not to track you. We're using essential cookies only. You can still change that below.
- Preferences title and lede: Cookie preferences / Choose which cookies Skyline can use. Essential cookies are always on so the site can work.
- Row texts: as in the list above.

**Components.** `CookieBanner`, `CookiePreferences` (native `<dialog>`), `useConsent` hook. Lives in the root layout, shared by every page.

## Privacy policy structure

Same outline as igethi's privacy policy, adapted to an agency site with no shop: who we are and how to contact us; personal information we collect (contact form, cookies and analytics); how we use it; how we share it (email provider, analytics provider); cookies and your choices (links to the preferences dialog); your rights (US state privacy laws, and GDPR for EU visitors); data retention; children; changes to this policy; contact.

## Content

- Legal text must come from the user or their counsel. We provide the structure and the cookie wording above; the policy and terms text itself is the user's.
- The privacy policy must reflect what the site actually does: analytics provider, the contact form's email provider (Resend in testing, SendGrid in production), cookies.

## Acceptance

Per part, as in `docs/specs/_TEMPLATE.md`.
