import { Starfield } from "@/components/hero/Starfield";
import { Hero } from "@/components/hero/Hero";
import { Guidelines } from "@/components/guidelines/Guidelines";
import { Faq } from "@/components/faqs/Faq";
import { Spons } from "@/components/spons/Spons";
import Footer from "@/components/footer/Footer";
import AboutUs from "./components/AboutUs/AboutUs";
import { GsapSectionScroller } from "@/components/hero/GsapSectionScroller";

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

