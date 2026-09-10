import { Hero } from "@/components/hero/Hero";
import { Faq } from "@/components/faqs/Faq";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <Faq />
    </div>
  );
}
