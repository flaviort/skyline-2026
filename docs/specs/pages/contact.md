# Page: Contact (`/contact`)

Status: spec
Approved by / date:

## Reference (`/contact`)

A short page: a sticker ("Jij bent aan de beurt"), serif lead, the CTA headline, one line, then two buttons side by side: call us (pink) and mail us (blue). The footer follows without the CTA block (the page already is one).

## Skyline version

The legacy site had a real form (name, email, message, reCAPTCHA, sent through SendGrid). The reference has no form, only call and mail buttons.

| # | Part | Content | Components |
|---|---|---|---|
| C1 | Header | Sticker (Nova: "Your turn, commander" or similar, to agree), lead, headline READY FOR / *LIFTOFF?*, line, buttons: Call us (`tel:+19728610416`), Email us (`mailto:accounts@theskylineagency.com`) | `Sticker`, `Heading`, `Button` |
| C2 | Form | Name, email, company (optional), message; sends from a Next.js route handler through an email API; spam protection with a honeypot plus Cloudflare Turnstile. Success and error states written in the site's voice. Run `/impeccable clarify` on labels and messages. | `Form`, `Field`, `Textarea`, `Button` |
| C3 | Footer | Footer without the CTA block | `Footer` `showCta={false}` |

### Decisions for this page

- Form: yes (Q9, approved).
- Email provider (Q9, approved): the user's own Resend account for testing now, SendGrid for production later. The route handler talks to one small `sendMail` adapter, so switching providers is a config change, not a rewrite. API keys and sender details come from the user when this page is built; they live in Vercel environment variables, never in the repo.
- No database; messages are only emailed.
- Where messages go: accounts@theskylineagency.com unless the user says otherwise.

## Acceptance

Per part, as in `docs/specs/_TEMPLATE.md`. Plus:
- [ ] Form validates on the client and the server, keeps input on error, and announces errors to screen readers
- [ ] A test message arrives in the inbox from the preview deploy
