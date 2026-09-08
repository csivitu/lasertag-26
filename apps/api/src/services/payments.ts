import { NotFoundError } from "../errors";

export type PaymentDetail = {
  bookingId: string;
  type: string;
  userId: string;
  paid: boolean;
  userName: string;
  userEmail: string;
};

export type PaymentUser = { id: string; name: string; email: string; paid: boolean };

/** Everything this service needs from the database, and nothing more. */
export interface PaymentsDeps {
  findBookingWithUser(registrationId: string): Promise<PaymentDetail | undefined>;
  findBookingUserId(registrationId: string): Promise<string | undefined>;
  setUserPaid(userId: string, paid: boolean): Promise<PaymentUser>;
}

export function makePaymentsService(deps: PaymentsDeps) {
  return {
    /** @throws NotFoundError */
    async getDetails(registrationId: string): Promise<PaymentDetail> {
      const detail = await deps.findBookingWithUser(registrationId);
      if (!detail) throw new NotFoundError("Registration not found");
      return detail;
    },

    /** @throws NotFoundError */
    async updateStatus(registrationId: string, paid: boolean): Promise<PaymentUser> {
      const userId = await deps.findBookingUserId(registrationId);
      if (!userId) throw new NotFoundError("Registration not found");
      return deps.setUserPaid(userId, paid);
    },
  };
}

export type PaymentsService = ReturnType<typeof makePaymentsService>;
