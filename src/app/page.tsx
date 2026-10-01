import { Banner } from "@/components/sections/home/banner";
import { NovaLayer } from "@/components/three/nova-layer";

export default function Home() {
  return (
    <main className="relative">
      <Banner />
      {/* Stand-in for parts 02 onward so the banner's scroll-out can be reviewed. */}
      <section id="agency" className="px-page grid min-h-[150svh] place-items-center text-mute">
        <p className="para-m">Part 03, agency, comes next.</p>
      </section>
      <NovaLayer />
    </main>
  );
}
