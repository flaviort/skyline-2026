import type { Metadata } from "next";
import type { Project } from "@/content/projects";
import { contact, socials } from "@/content/site";

// Search and sharing: one helper for every page's metadata and the
// structured data (JSON-LD) the pages render with <JsonLd>. Facts only, from
// src/content; the two testimonials stay out of the schema until confirmed
// (and self-published reviews don't earn rich results anyway).

export const SITE = {
  url: "https://theskylineagency.com",
  name: "The Skyline Agency",
  legalName: "The Skyline Agency LLC",
  description:
    "The Skyline Agency is a Dallas digital agency for strategy, branding, web development, UX, digital marketing, SEO and media production.",
  locale: "en_US",
};

export const absolute = (path: string) => new URL(path, SITE.url).toString();

const HOME_TITLE = `${SITE.name} | Dallas Digital Marketing & Design`;
/** src/app/opengraph-image.tsx */
const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "The Skyline Agency, a digital agency in Dallas, TX" };

type PageMeta = {
  title?: string;
  description: string;
  /** Path of the page, for the canonical URL and og:url */
  path: string;
  /** A specific share image (defaults to the generated site image) */
  image?: { url: string; width?: number; height?: number; alt?: string };
  type?: "website" | "article";
  noindex?: boolean;
};

/** Title, description, canonical URL, Open Graph and Twitter card for one page. */
export function pageMetadata({ title, description, path, image, type = "website", noindex }: PageMeta): Metadata {
  const shareTitle = title ? `${title} | ${SITE.name}` : HOME_TITLE;
  // A page's openGraph replaces the inherited one whole, so the generated site image is named here.
  const images = [image ?? DEFAULT_IMAGE];
  return {
    title: title ?? { absolute: HOME_TITLE },
    description,
    alternates: { canonical: path },
    openGraph: { title: shareTitle, description, url: path, siteName: SITE.name, locale: SITE.locale, type, images },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: images.map((i) => i.url) },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}

// --- Structured data ------------------------------------------------------

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

/** The agency as a local business (on every page through the root layout). */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": ORG_ID,
  name: SITE.name,
  legalName: SITE.legalName,
  url: SITE.url,
  logo: absolute("/brand/logo-mark.svg"),
  image: absolute("/opengraph-image"),
  description: SITE.description,
  email: contact.email,
  telephone: "+1-972-861-0416",
  address: { "@type": "PostalAddress", streetAddress: "1529 Dragon St", addressLocality: "Dallas", addressRegion: "TX", postalCode: "75207", addressCountry: "US" },
  geo: { "@type": "GeoCoordinates", latitude: 32.7767, longitude: -96.797 },
  areaServed: "United States",
  contactPoint: [{ "@type": "ContactPoint", telephone: "+1-972-861-0416", email: contact.email, contactType: "sales", areaServed: "US", availableLanguage: ["English", "Spanish"] }],
  sameAs: socials.map((link) => link.href),
  knowsAbout: ["Digital Strategy", "Branding", "Web Development", "User Experience", "Digital Marketing", "SEO", "Media Production"],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": SITE_ID,
  url: SITE.url,
  name: SITE.name,
  inLanguage: "en-US",
  publisher: { "@id": ORG_ID },
};

/** Home > ... > this page. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absolute(item.path) })),
  };
}

/** A page of a given schema.org type (AboutPage, ContactPage, CollectionPage...). */
export function webPageSchema(type: string, { name, description, path }: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${absolute(path)}#webpage`,
    url: absolute(path),
    name,
    description,
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en-US",
  };
}

const mediaUrl = (project: Project) => absolute(project.cover.type === "image" ? project.cover.src : project.cover.poster);

/** A case study as a creative work made by Skyline for its client. */
export function caseStudySchema(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absolute(`/work/${project.slug}`)}#work`,
    name: `${project.title}, ${project.subtitle}`,
    headline: project.subtitle,
    description: project.description,
    url: absolute(`/work/${project.slug}`),
    image: mediaUrl(project),
    dateCreated: String(project.year),
    genre: project.industries.join(", "),
    keywords: project.services.join(", "),
    creator: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    ...(project.url && { sameAs: project.url }),
    about: { "@type": "Organization", name: project.title, ...(project.url && { url: project.url }) },
  };
}

/** The work index as an ordered list of case studies. */
export function workListSchema(projects: Project[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: projects.map((project, index) => ({ "@type": "ListItem", position: index + 1, url: absolute(`/work/${project.slug}`), name: project.title })),
  };
}

/** The services as an offer catalog of the agency. */
export function servicesSchema(services: { slug: string; name: string; description: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Services",
    url: absolute("/services"),
    itemListElement: services.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", "@id": absolute(`/services#${service.slug}`), name: service.name, description: service.description, provider: { "@id": ORG_ID }, areaServed: "United States" },
    })),
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
}
