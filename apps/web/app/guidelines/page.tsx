import { Starfield } from "@/components/hero/Starfield";
import { Guidelines } from "@/components/guidelines/Guidelines";

export default function GuidelinesPage() {
  return (
    <div className="relative flex flex-1 flex-col bg-ink">
      <Starfield fixed />
      <Guidelines />
    </div>
  );
}
