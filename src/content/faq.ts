// FAQ (docs/specs/pages/faq.md). Questions whose answer the team still has to
// write (hosting and maintenance, retainers) are left out until they do; the
// items marked [confirm] in the spec ship with the drafted answer and are
// listed as pending in docs/CONTENT.md.

export type FaqGroup = { title: string; items: { q: string; a: string }[] };

export const faqPage = {
  eyebrow: "Questions before liftoff?",
  title: [{ text: "Ask mission" }, { text: "control", accent: true }],
};

export const faq: FaqGroup[] = [
  {
    title: "Working with us",
    items: [
      {
        q: "What does The Skyline Agency do?",
        a: "We're a full-service digital agency: digital strategy, branding, web development, user experience, digital marketing, SEO and media production. One crew covers the whole path, from the first idea to the campaign that grows it.",
      },
      {
        q: "Where are you based? Do you work with clients outside Dallas?",
        a: "Our home base is 1529 Dragon St in Dallas, Texas, and we also have people in Brazil and Canada. We work with brands across the US and abroad.",
      },
      {
        q: "What kind of companies do you work with?",
        a: "National and global brands, and startups that need to punch above their weight. Our work spans food, fitness and supplements, wellness, art and entertainment.",
      },
      {
        q: "How does a project start?",
        a: "With a conversation. Tell us where you are and where you want to go, and we'll come back with a plan and a proposal.",
      },
      {
        q: "Who will we be working with?",
        a: "A small team of senior people and sharp strategists, with one point of contact who keeps the project moving.",
      },
      {
        q: "Can you work alongside our in-house team or another agency?",
        a: "Yes. We can lead the whole project or plug into the team you already have.",
      },
    ],
  },
  {
    title: "Websites",
    items: [
      {
        q: "Do you design websites from scratch or use templates?",
        a: "Every site is designed for the brand it serves, then built to be fast and easy to use.",
      },
      {
        q: "Can you redesign our current website?",
        a: "Yes. We start from what's working, fix what isn't, and keep your search rankings in mind during the move.",
      },
      {
        q: "Will we be able to update the website ourselves?",
        a: "Yes, when you need to. We set up editing that matches how often your team changes content.",
      },
    ],
  },
  {
    title: "Branding and design",
    items: [
      { q: "Can you build a brand from scratch?", a: "Yes: name, positioning, visual identity and how it all shows up online." },
      {
        q: "Can you refresh our brand without losing what people already recognize?",
        a: "Yes. A refresh keeps the equity you've built and fixes what holds the brand back.",
      },
      {
        q: "Do you create 3D and product visuals?",
        a: "Yes. We've produced 3D work for brands like Airly, Barker Wellness, Think Apollo and Dymatize.",
      },
    ],
  },
  {
    title: "Social, marketing and SEO",
    items: [
      {
        q: "Do you run social media and paid ad campaigns?",
        a: "Yes. Social, content marketing, email campaigns and paid advertising, planned around goals we can measure.",
      },
      {
        q: "Do you create content, including photo and video?",
        a: "Yes. Our media production team shoots and edits for social, web and ads; see our work for Airly, Think Apollo and Dymatize.",
      },
      {
        q: "How long does SEO take to show results?",
        a: "SEO is a long game: technical fixes can pay off quickly, while rankings build over months. We'll be straight with you about what to expect for your market.",
      },
      {
        q: "How do you measure success?",
        a: "We agree on the numbers that matter before we start and report on them as we go.",
      },
    ],
  },
  {
    title: "Pricing and timelines",
    items: [
      {
        q: "How much does a project cost?",
        a: "It depends on what we're building. After a first conversation we send a proposal with a clear scope and price.",
      },
      { q: "How long does a project take?", a: "That depends on scope too. Every proposal includes a timeline." },
    ],
  },
];
