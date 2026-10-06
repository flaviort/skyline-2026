import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { LaunchIntro } from "@/components/layout/launch-intro";
import { Menu } from "@/components/layout/menu";
import { Starfield } from "@/components/motion/starfield";
import { DevCursors } from "@/components/providers/dev-cursors";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import "./globals.css";

// The site's one typeface (decision Q24, sans only): the stand-in for the
// reference's Helvetica Now, variable from 100 to 900 so the cursor weight
// effect has room to move. Accent lines use a hairline weight of it.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const INTRO_SCRIPT = [
  "var c=document.documentElement.classList;c.add('js');",
  "if(!matchMedia('(prefers-reduced-motion: reduce)').matches){c.add('intro','intro-lock');history.scrollRestoration='manual'}",
].join("");

export const metadata: Metadata = {
  metadataBase: new URL("https://theskylineagency.com"),
  title: {
    default: "The Skyline Agency | Dallas Digital Marketing & Design",
    template: "%s | The Skyline Agency",
  },
  description:
    "The Skyline Agency is a Dallas digital agency for strategy, branding, web development, UX, digital marketing, SEO and media production.",
  openGraph: {
    siteName: "The Skyline Agency",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={interTight.variable} suppressHydrationWarning>
      <head>
        {/* Before first paint: marks JavaScript as available so reveal targets can
            start hidden, and, unless reduced motion is on, shows the launch intro
            (part 11a) and locks scroll for it. A reload starts at the top. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <DevCursors />
        {/* Fixed stars behind every page; dark sections are transparent over them. */}
        <Starfield className="fixed inset-0 -z-10" />
        <SmoothScroll>
          <Menu />
          {children}
          <LaunchIntro />
        </SmoothScroll>
      </body>
    </html>
  );
}
