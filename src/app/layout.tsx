import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { CookieConsent } from "@/components/consent/cookie-consent";
import { LaunchIntro } from "@/components/layout/launch-intro";
import { Menu } from "@/components/layout/menu";
import { Starfield } from "@/components/motion/starfield";
import { DevCursors } from "@/components/providers/dev-cursors";
import { RouteSync } from "@/components/providers/route-sync";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { JsonLd } from "@/components/seo/json-ld";
import { LITE_QUERY } from "@/lib/lite";
import { organizationSchema, SITE, websiteSchema } from "@/lib/seo";
import "./globals.css";

// The site's one typeface (decision Q24, sans only): the stand-in for the
// reference's Helvetica Now, variable from 100 to 900 so the cursor weight
// effect has room to move. Accent lines use a hairline weight of it.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const INTRO_SCRIPT = [
  "var c=document.documentElement.classList;c.add('js');",
  `var lite=matchMedia('${LITE_QUERY}').matches;if(lite)c.add('lite');`,
  "if(!lite&&!matchMedia('(prefers-reduced-motion: reduce)').matches){c.add('intro','intro-lock');history.scrollRestoration='manual'}",
].join("");

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "The Skyline Agency | Dallas Digital Marketing & Design",
    template: "%s | The Skyline Agency",
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={interTight.variable} suppressHydrationWarning>
      <head>
        {/* Before first paint: marks JavaScript as available so reveal targets can
            start hidden, and, unless reduced motion is on or this is a phone
            (the lite start, src/lib/lite.ts), shows the launch intro (part 11a)
            and locks scroll for it. A reload starts at the top. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <DevCursors />
        {/* Fixed stars behind every page; dark sections are transparent over them. */}
        <Starfield className="fixed inset-0 -z-10" />
        <SmoothScroll>
          <RouteSync />
          <Menu />
          {children}
          <CookieConsent />
          <LaunchIntro />
        </SmoothScroll>
      </body>
    </html>
  );
}
