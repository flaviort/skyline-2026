// Cookie banner, preferences and the legal pages. New copy, waiting for
// approval in docs/CONTENT.md. The policy and terms are drafts written from
// what the site actually does; they need a review by Skyline's counsel before
// launch. The playful lines are headlines only: every explanation underneath
// says plainly what happens.

import type { ConsentChoice } from "@/lib/consent";

export const cookieCopy = {
  banner: {
    eyebrow: "Cookie check",
    title: "Houston, we have cookies",
    body: "A few keep this ship flying, so those stay on. The rest only come aboard if you say yes: analytics shows us which pages you liked, marketing helps us find more people like you.",
    privacy: { label: "Privacy policy", href: "/privacy" },
    essentials: "Essentials only",
    choose: "Let me choose",
    accept: "Accept all",
  },
  signal: {
    eyebrow: "Signal received",
    title: "We got your browser's memo",
    body: "Your browser asked us not to track you, so we won't. Only the essentials are on. You can still change that if you like.",
    ok: "Got it",
    choose: "Change settings",
  },
  dialog: {
    eyebrow: "Mission control",
    title: "Pick your cookies",
    lede: "The essentials are always on so the site works. Everything else is your call, and you can change it any time from the footer.",
    close: "Close",
    essentials: "Essentials only",
    accept: "Accept all",
    save: "Save my choices",
    signal: "Your browser sends a Do Not Track or Global Privacy Control signal. We start from essentials only.",
  },
  rows: [
    {
      key: "essential",
      name: "Life support",
      kind: "Essential",
      body: "Security, loading pages and remembering this choice. These can't be switched off: the ship needs air.",
    },
    {
      key: "preferences",
      name: "Cabin settings",
      kind: "Preferences",
      body: "Remembers small things you set on the site, so you don't have to set them twice.",
    },
    {
      key: "analytics",
      name: "Telemetry",
      kind: "Analytics",
      body: "Counts visits and clicks with Google Analytics, so we can see which pages work. No ads, no selling.",
    },
    {
      key: "marketing",
      name: "Transmissions",
      kind: "Marketing",
      body: "Lets ad platforms like Meta measure our campaigns and show you our work elsewhere.",
    },
    {
      key: "doNotSell",
      name: "Radio silence",
      kind: "Do not sell or share",
      body: "Opts you out of selling or sharing your data with third parties under US state privacy laws. Marketing stays off while this is on.",
    },
  ] satisfies { key: keyof ConsentChoice | "essential"; name: string; kind: string; body: string }[],
  saved: "Course set. Your choices are saved.",
  footerLink: "Cookie preferences",
};

// --- Legal pages ---------------------------------------------------------

export type LegalBlock = string | { list: string[] } | { action: "cookies"; label: string };
export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };
export type LegalDocument = {
  eyebrow: string;
  title: { text: string; accent?: boolean }[];
  intro: string;
  updated: string;
  sections: LegalSection[];
};

const company = "The Skyline Agency LLC";
const address = "1529 Dragon St, Dallas, TX 75207";
const email = "accounts@theskylineagency.com";

export const privacy: LegalDocument = {
  eyebrow: "Privacy policy",
  title: [{ text: "Your data," }, { text: "in orbit", accent: true }],
  intro: "The short version: we collect what you send us and, only if you say yes, how you use the site. We don't sell it. The long version is below, in plain English.",
  updated: "October 8, 2026",
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      blocks: [
        `This website, theskylineagency.com, is run by ${company}, a digital agency at ${address}, United States ("Skyline", "we", "us"). We are responsible for the personal information described in this policy.`,
        `Questions about privacy go to ${email}.`,
      ],
    },
    {
      id: "what-we-collect",
      title: "What we collect",
      blocks: [
        "Only what we need:",
        {
          list: [
            "What you send us: when you use the contact form or email us, your name, email address, company if you add it, the services you are interested in and your message.",
            "Technical basics: like any website, our hosting provider processes your IP address, browser type and the pages you request, so the site can load and stay secure.",
            "Your cookie choice: stored in your own browser so we remember it.",
            "Usage data, only with your consent: if you turn on analytics, Google Analytics records pages visited, time on site, device type and approximate location (from a shortened IP address).",
            "Advertising data, only with your consent: if you turn on marketing, the Meta Pixel records visits so we can measure and target our own ads.",
          ],
        },
        "We don't ask for sensitive information, and we don't collect payment details on this site.",
      ],
    },
    {
      id: "how-we-use-it",
      title: "How we use it",
      blocks: [
        {
          list: [
            "To answer your message and talk about a possible project.",
            "To keep the site running, secure and free of abuse (the contact form has spam protection).",
            "With your consent, to understand which pages are useful and improve them.",
            "With your consent, to measure and show our own advertising.",
          ],
        },
        "For visitors in the EU and the UK, our legal bases are your consent (analytics and marketing), our legitimate interest in running a secure website and replying to inquiries, and taking steps you ask for before a contract.",
      ],
    },
    {
      id: "sharing",
      title: "Who we share it with",
      blocks: [
        "We don't sell your personal information. We share it only with the services that help us run the site, and only for that purpose:",
        {
          list: [
            "Vercel, which hosts the website.",
            "Our email provider (Resend or SendGrid), which delivers contact form messages to our inbox.",
            "Google (Google Analytics), only if you allow analytics.",
            "Meta (Meta Pixel), only if you allow marketing and have not opted out of sharing.",
          ],
        },
        "We may also disclose information if the law requires it, or to protect our rights, our clients or the public.",
        "Some of these providers process data outside your country, including in the United States. Where the law requires it, they rely on recognized safeguards such as standard contractual clauses.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and your choices",
      blocks: [
        "Essential cookies and storage keep the site working and remember your cookie choice. Everything else is off until you switch it on: preferences, analytics (Google Analytics cookies such as _ga) and marketing (Meta cookies such as _fbp).",
        "If your browser sends a Do Not Track or Global Privacy Control signal, we start you on essentials only and treat it as an opt-out of selling or sharing.",
        "You can change your mind at any time. Switching a category off stops it and removes its cookies from this site.",
        { action: "cookies", label: "Open cookie preferences" },
      ],
    },
    {
      id: "your-rights",
      title: "Your rights",
      blocks: [
        "Depending on where you live (for example California, Texas, other US states with privacy laws, the EU or the UK), you may have the right to:",
        {
          list: [
            "Know what personal information we hold about you and get a copy.",
            "Correct it if it is wrong.",
            "Have it deleted.",
            "Opt out of the sale or sharing of your information and of targeted advertising.",
            "Withdraw consent at any time, without affecting what happened before.",
            "Complain to your local data protection authority.",
          ],
        },
        `To use any of these rights, email ${email}. We will answer within the time the law allows and won't treat you differently for asking. We may need to confirm who you are first.`,
      ],
    },
    {
      id: "retention",
      title: "How long we keep it",
      blocks: [
        "Contact form messages stay in our inbox for as long as we are talking with you and for a reasonable time afterwards, up to two years unless you become a client or ask us to delete them sooner. Analytics data is kept for 14 months. Your cookie choice stays in your browser until you clear it or change it.",
      ],
    },
    {
      id: "security",
      title: "Security",
      blocks: ["The site runs over an encrypted connection (HTTPS), and access to messages is limited to the people who need them. No system is perfectly secure, but we take reasonable steps to protect your information."],
    },
    {
      id: "children",
      title: "Children",
      blocks: ["This site is meant for businesses and is not directed at children under 13 (16 in the EU). We don't knowingly collect their information; if you think we have, tell us and we will delete it."],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: ["If we change how we handle your information, we will update this page and the date at the top. Big changes will also bring the cookie banner back so you can choose again."],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [`${company}, ${address}. Email ${email}.`],
    },
  ],
};

export const terms: LegalDocument = {
  eyebrow: "Terms of use",
  title: [{ text: "Flight" }, { text: "rules", accent: true }],
  intro: "These terms cover your use of this website. They're short and we tried to keep them human. Working with us on a project is covered by a separate agreement.",
  updated: "October 8, 2026",
  sections: [
    {
      id: "agreement",
      title: "The agreement",
      blocks: [
        `By using theskylineagency.com you agree to these terms, set by ${company} ("Skyline", "we", "us"). If you don't agree, please don't use the site.`,
        "These terms are about the website only. Any work we do for you is governed by the proposal or contract we both sign.",
      ],
    },
    {
      id: "using-the-site",
      title: "Using the site",
      blocks: [
        "You're welcome to browse, share links and get in touch. Please don't:",
        {
          list: [
            "Try to break, overload, scrape or get around the security of the site.",
            "Send spam, malware or anything unlawful through the contact form.",
            "Pretend to be someone else, or to be Skyline.",
          ],
        },
      ],
    },
    {
      id: "our-work",
      title: "Our work and our clients' work",
      blocks: [
        "The site's design, code, text, the Skyline name and logo, and Nova the astronaut belong to Skyline. The case studies show work we made for our clients; their names, logos, products and images belong to them and appear here with their permission.",
        "You may share pages and link to them. You may not copy, republish or sell our content or our clients' material without written permission.",
      ],
    },
    {
      id: "your-messages",
      title: "What you send us",
      blocks: [
        "When you contact us, you confirm that what you send is accurate and yours to share. Please don't send confidential information before we have agreed in writing to keep it confidential. How we handle your information is described in our privacy policy.",
      ],
    },
    {
      id: "no-guarantees",
      title: "No guarantees",
      blocks: [
        "We work hard to keep the site accurate and online, but it is provided as is. We don't promise it will always be available or free of errors, and nothing on it is an offer or a guarantee of results. Figures and case results describe past work.",
      ],
    },
    {
      id: "liability",
      title: "Limits of liability",
      blocks: [
        "To the extent the law allows, Skyline is not liable for indirect or consequential losses from using the site or relying on its content, and our total liability for anything related to the site is limited to US$100. Some places don't allow these limits, so they may not apply to you.",
      ],
    },
    {
      id: "links",
      title: "Links to other sites",
      blocks: ["We link to client sites and social networks. We don't control them and aren't responsible for their content or privacy practices."],
    },
    {
      id: "law",
      title: "Governing law",
      blocks: ["These terms are governed by the laws of the State of Texas, United States. Any dispute about the site goes to the state or federal courts in Dallas County, Texas, unless the law where you live says otherwise."],
    },
    {
      id: "changes",
      title: "Changes",
      blocks: ["We may update these terms. The date at the top shows the latest version, and using the site after a change means you accept it."],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [`${company}, ${address}. Email ${email}.`],
    },
  ],
};
