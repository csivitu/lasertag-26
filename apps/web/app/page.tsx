import dynamic from "next/dynamic";
import { Starfield } from "@/components/hero/Starfield";
import { Hero } from "@/components/hero/Hero";
import { GsapSectionScroller } from "@/components/hero/GsapSectionScroller";

const AboutUs = dynamic(() => import("./components/AboutUs/AboutUs"));
const Spons = dynamic(() => import("@/components/spons/Spons").then((m) => m.Spons));
const Guidelines = dynamic(() => import("@/components/guidelines/Guidelines").then((m) => m.Guidelines));
const Faq = dynamic(() => import("@/components/faqs/Faq").then((m) => m.Faq));
const Footer = dynamic(() => import("@/components/footer/Footer"));

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col bg-ink">
      <GsapSectionScroller />
      <Starfield fixed />
      <div data-snap-section>
        <Hero />
      </div>
      <div data-snap-section>
        <AboutUs />
      </div>
      <div data-snap-section>
        <Spons />
      </div>
      <div data-snap-section>
        <Guidelines />
      </div>
      <div data-snap-section>
        <Faq />
      </div>
      <div data-snap-section>
        <Footer />
      </div>
    </div>
  );
}
