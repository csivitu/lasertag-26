import { redirect } from "next/navigation";

// The payments workstation was renamed to verification.
export default function PaymentsRedirect() {
  redirect("/verification");
}
