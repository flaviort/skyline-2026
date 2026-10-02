import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
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
        {/* Marks JavaScript as available before first paint so reveal targets can start hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <DevCursors />
        {/* Fixed stars behind every page; dark sections are transparent over them. */}
        <Starfield className="fixed inset-0 -z-10" />
        <SmoothScroll>
          <Menu />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
