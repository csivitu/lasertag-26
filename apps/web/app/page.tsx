import { redirect } from "next/navigation";

// The hero page is being built by another team member (manan branch).
// On this branch (shreya), only the /register popup flow is in scope.
// Redirect root to /register for easy local testing.
export default function Home() {
  redirect("/register");
}
