// The seven services (unchanged from the old site) under the three pillars
// from the homepage's What we do (approved copy, docs/CONTENT.md).
// Descriptions for Web Development, User Experience and Digital Marketing are
// the old about page's; the other four are new, built from the FAQ drafts,
// and wait for approval in docs/CONTENT.md.

export type Service = {
  slug: string;
  name: string;
  description: string;
  /** Case studies that show this service (project slugs) */
  work: string[];
};

export type Pillar = { name: string; line: string; services: Service[] };

export const pillars: Pillar[] = [
  {
    name: "Strategy",
    line: "Digital strategy and SEO that aim the rocket somewhere worth going.",
    services: [
      {
        slug: "digital-strategy",
        name: "Digital Strategy",
        description:
          "Every mission starts with a destination. We dig into your audience, your market and the numbers that matter, then plot the route from the first idea to the campaign that grows it.",
        work: ["dymatize", "airly"],
      },
      {
        slug: "seo",
        name: "SEO",
        description:
          "Technical fixes that pay off quickly and rankings that build month after month. We keep your search equity safe through a redesign and tell you straight what to expect in your market.",
        work: ["barker-wellness", "think-apollo"],
      },
    ],
  },
  {
    name: "Design",
    line: "Branding, UX and websites people actually remember.",
    services: [
      {
        slug: "branding",
        name: "Branding",
        description:
          "Name, positioning, visual identity and how it all shows up online. A refresh keeps the equity you've built and fixes what holds the brand back.",
        work: ["think-apollo", "sophie-brussaux"],
      },
      {
        slug: "user-experience",
        name: "User Experience",
        description:
          "Exceptional user experiences are at the core of our approach. We create intuitive interfaces and effortless navigation, ensuring positive interactions with your brand across platforms.",
        work: ["barker-wellness", "andrew-callaghan"],
      },
      {
        slug: "web-development",
        name: "Web Development",
        description:
          "We design visually stunning and user-friendly websites that align with your brand. Our process focuses on seamless navigation and optimized performance, creating online experiences that captivate visitors and drive conversions.",
        work: ["andrew-callaghan", "sophie-brussaux", "airly"],
      },
    ],
  },
  {
    name: "Social",
    line: "Social campaigns, content and video that keep people watching and coming back.",
    services: [
      {
        slug: "digital-marketing",
        name: "Digital Marketing",
        description:
          "We tailor strategies to help you achieve your marketing goals. Through social media, content marketing, email campaigns, and paid advertising, we reach and engage your target audience with measurable success.",
        work: ["airly", "think-apollo"],
      },
      {
        slug: "media-production",
        name: "Media Production",
        description:
          "Photo, video and 3D, shot, rendered and edited in house for social, web and ads. Product renders for Dymatize, a full shoot for Airly, launch content for Think Apollo.",
        work: ["dymatize", "airly", "think-apollo"],
      },
    ],
  },
];

export const services = pillars.flatMap((pillar) => pillar.services.map((service) => ({ ...service, pillar: pillar.name })));

export const servicesPage = {
  eyebrow: "Services",
  title: [{ text: "Seven ways" }, { text: "to leave orbit", accent: true }],
  // Legacy home services block.
  intro:
    "We are driven by a deep-seated passion for uncovering the most cutting-edge and innovative digital solutions, and by constantly pushing the boundaries of what's possible.",
};
