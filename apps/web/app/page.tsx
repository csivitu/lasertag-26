import { Hero } from "@/components/hero/Hero";
import { Faq } from "@/components/faqs/Faq";
import Footer from "@/components/footer/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <Faq />
      <Footer />
    </div>
  );
}
