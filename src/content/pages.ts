// Copy for the inner pages. Legacy copy is from the old site (skyline-2023);
// anything new is listed in docs/CONTENT.md and waits for approval there.

export const aboutPage = {
  eyebrow: "About Skyline",
  title: [{ text: "We grow" }, { text: "brands", accent: true }, { text: "astronomically" }],
  intro:
    "We're a full-service digital advertising and branding agency based in Dallas, TX, working for national and global brands, and for startups that need to punch above their weight.",
  story:
    "Our team consists of top-notch industry vets and forward-thinking millennials who have launched multimillion dollar portfolios globally for over 10 years. Along with our vast experience and innovative trends and technology, we provide outstanding support for all of our clients.",
  statement: "We are not just an ad agency. We are a full-service growth facility.",
  stewardship:
    "By hiring with intent, we've built a team of talent that is equally flexible and focused. With unparalleled experience in creating profitable businesses and unforgettable brands, your success is our success. Being approachable and communicative, we pride ourselves on being good stewards of your dollar.",
  photos: [
    { src: "/images/legacy/agency-02.jpg", alt: "The Skyline building at 1529 Dragon St, Dallas", width: 1600, height: 1071 },
    { src: "/images/legacy/agency-01.jpg", alt: "Inside the Skyline office in the Dallas Design District", width: 1400, height: 1982 },
    { src: "/images/legacy/agency-03.jpg", alt: "A sculpture in the Skyline office", width: 1000, height: 1422 },
  ],
  hq: { label: "Headquarters", value: "1529 Dragon St, Dallas Design District" },
  deck: { label: "Download our capabilities deck", href: "/downloads/skyline-capabilities-deck.pdf" },
  servicesLead: "Strategy, brand, web, UX, marketing, SEO and media production, in one crew.",
};

export const workPage = {
  eyebrow: "Work",
  title: [{ text: "Missions" }, { text: "we flew", accent: true }],
  // Legacy projects page.
  intro:
    "A summary of the most impactful cases that we have built with the support of visionary clients and friends, all of them made with great enthusiasm over the years.",
};

export const contactPage = {
  eyebrow: "Contact",
  title: [{ text: "Let's" }, { text: "talk", accent: true }],
  // Legacy contact page.
  intro:
    "Whether it's a project you'd like to share, an interest in joining our team, or just a friendly greeting, don't hesitate to get in touch. We're excited to receive your message.",
  form: {
    name: { label: "What's your name?", placeholder: "Jane Doe" },
    email: { label: "What's your email?", placeholder: "jane@company.com" },
    company: { label: "Company", placeholder: "Optional" },
    interest: { label: "I'm interested in" },
    message: { label: "Your message", placeholder: "Tell us where you want to go" },
    submit: "Send it!",
    sending: "Sending",
    // Legacy success popup.
    success: { title: "Message received", body: "Thank you for reaching out to us! We'll get back to you as soon as possible." },
    error: "Something went wrong on our side. Email us directly and we'll pick it up from there.",
  },
  copied: "Copied",
};

export const notFoundPage = {
  code: "404",
  title: [{ text: "Lost in" }, { text: "space", accent: true }],
  line: "This page drifted out of orbit. Let's get you back to base.",
  button: { label: "Back to base", href: "/" },
};

// From the old site's structured data. Never shown on the old pages; both
// need the user's confirmation before launch (docs/CONTENT.md).
export const testimonials = {
  title: [{ text: "Kind" }, { text: "words", accent: true }],
  items: [
    {
      quote:
        "My business has grown so much online because of their marketing expertise. They really know what they are doing, and they **provide updates each week** so you can see the improvements yourself.",
      name: "Alexander Smithson",
      role: "Client for almost a year",
    },
    {
      quote: "**One of the best agencies I've ever worked with.** Super fast, super professional and they are smart enough to strategize plans from start to finish.",
      name: "Skyler Crash",
      role: "Client",
    },
  ],
  invite: { line: "Your mission could be next.", label: "Start your mission", href: "/contact" },
};
