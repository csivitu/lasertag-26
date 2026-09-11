import { Hero } from "@/components/hero/Hero";
import { Faq } from "@/components/faqs/Faq";
import { Spons } from "@/components/spons/Spons";
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <Faq />
      <Spons />
    </div>
  );
}
