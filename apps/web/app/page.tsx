import { Starfield } from "@/components/hero/Starfield";
import { Hero } from "@/components/hero/Hero";
import { Guidelines } from "@/components/guidelines/Guidelines";
import { Faq } from "@/components/faqs/Faq";
import { Spons } from "@/components/spons/Spons";
import Footer from "@/components/footer/Footer";
import AboutUs from "./components/AboutUs/AboutUs";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col bg-ink">
      <Starfield fixed />
      <Hero />
      <AboutUs />
      <Spons />
      <Guidelines />
      <Faq />
      <Footer />
    </div>
  );
}
