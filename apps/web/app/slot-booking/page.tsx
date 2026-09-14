import { SlotBooking } from "@/components/slot-booking/SlotBooking";
import { AuthGate } from "@/components/auth/AuthGate";
import "./slot-booking.css";

export default function SlotBookingPage() {
  return (
    <AuthGate
      title="RESTRICTED ACCESS"
      message="PLEASE SIGN IN TO IDENTIFY OPERATIVE STATUS AND ACCESS ARENA SLOT BOOKING."
    >
      <SlotBooking />
    </AuthGate>
  );
}
