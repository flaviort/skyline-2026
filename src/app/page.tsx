import { About } from "@/components/sections/home/about";
import { Banner } from "@/components/sections/home/banner";
import { NovaLayer } from "@/components/three/nova-layer";
import { NOVA_LANDING } from "@/lib/nova-landing";

export default function Home() {
  return (
    <main className="relative">
      <Banner />
      {/* Scroll room for the space journey: Nova and the cast play on the fixed canvas above it. */}
      <div id="journey" aria-hidden className="space-journey" />
      <About />
      {/* Stand-in for parts 02 onward so the about section's scroll-out can be reviewed. */}
      <section id="agency" className="px-page grid min-h-[100svh] place-items-center text-mute">
        <p className="para-m">Part 03, agency, comes next.</p>
      </section>
      <NovaLayer landingSelector={NOVA_LANDING} />
    </main>
  );
}
