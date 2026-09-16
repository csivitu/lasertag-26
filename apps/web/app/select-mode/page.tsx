import { redirect } from "next/navigation";

// DEPRECATED: team/select-mode flow disabled — sign-in goes straight to slot booking.
// Kept for easy restore; direct visits redirect to booking.
export default function SelectModePage() {
  redirect("/slot-booking");
}
