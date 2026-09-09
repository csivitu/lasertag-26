/**
 * A "registration" is a booking, joined to the user who made it. There is no
 * registrations table — see packages/database/schema.ts.
 */

export type RegistrationFilters = {
  reg_no?: string;
  name?: string;
  phone?: string;
  email?: string;
};

/** The flat shape returned by the bookings -> user join. */
export type RegistrationRow = {
  regNo: string;
  type: "individual" | "team";
  teamCode: string | null;
  slotId: string;
  confirmationEmailSent: boolean;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  paid: boolean;
  isCheckedIn: boolean;
  checkedInAt: Date | null;
};

export type RegistrationDto = {
  regNo: string;
  type: "individual" | "team";
  teamCode: string | null;
  slotId: string;
  confirmationEmailSent: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    paid: boolean;
    isCheckedIn: boolean;
    checkedInAt: Date | null;
  };
};

export interface RegistrationsDeps {
  search(filters: RegistrationFilters): Promise<RegistrationRow[]>;
}

/** Pure: flattened join row -> the nested shape the API returns. */
export function toRegistrationDto(row: RegistrationRow): RegistrationDto {
  return {
    regNo: row.regNo,
    type: row.type,
    teamCode: row.teamCode,
    slotId: row.slotId,
    confirmationEmailSent: row.confirmationEmailSent,
    user: {
      id: row.userId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      paid: row.paid,
      isCheckedIn: row.isCheckedIn,
      checkedInAt: row.checkedInAt,
    },
  };
}

export function makeRegistrationsService(deps: RegistrationsDeps) {
  return {
    async list(filters: RegistrationFilters): Promise<RegistrationDto[]> {
      const rows = await deps.search(filters);
      return rows.map(toRegistrationDto);
    },
  };
}

export type RegistrationsService = ReturnType<typeof makeRegistrationsService>;
