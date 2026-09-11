import { Hero } from "@/components/hero/Hero";
import { Faq } from "@/components/faqs/Faq";
import Footer from "@/components/footer/Footer";
import AboutUs from "./components/AboutUs/AboutUs";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <AboutUs />
      <Faq />
      <Footer />
    </div>
  );
}

