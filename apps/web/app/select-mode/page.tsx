import { SelectMode } from "@/components/select-mode/SelectMode";
import { AuthGate } from "@/components/auth/AuthGate";

export default function SelectModePage() {
  return (
    <main className="relative min-h-screen bg-[#08080d]">
      <AuthGate
        title="RESTRICTED ACCESS"
        message="PLEASE SIGN IN TO IDENTIFY OPERATIVE STATUS AND SELECT YOUR ARENA COMBAT MODE."
      >
        <SelectMode />
      </AuthGate>
    </main>
  );
}
