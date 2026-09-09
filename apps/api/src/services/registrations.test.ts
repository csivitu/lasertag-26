import { describe, expect, mock, test } from "bun:test";

import {
  makeRegistrationsService,
  toRegistrationDto,
  type RegistrationRow,
  type RegistrationsDeps,
} from "./registrations";

const row: RegistrationRow = {
  regNo: "reg-2026-0001",
  type: "individual",
  teamCode: null,
  slotId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  confirmationEmailSent: true,
  userId: "user-1",
  name: "Alicia Rao",
  email: "alicia@example.com",
  phone: "9876543210",
  paid: true,
  isCheckedIn: false,
  checkedInAt: null,
};

describe("toRegistrationDto", () => {
  test("nests the flat join row under user", () => {
    expect(toRegistrationDto(row)).toEqual({
      regNo: "reg-2026-0001",
      type: "individual",
      teamCode: null,
      slotId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      confirmationEmailSent: true,
      user: {
        id: "user-1",
        name: "Alicia Rao",
        email: "alicia@example.com",
        phone: "9876543210",
        paid: true,
        isCheckedIn: false,
        checkedInAt: null,
      },
    });
  });

  test("preserves a null teamCode", () => {
    expect(toRegistrationDto(row).teamCode).toBeNull();
  });
});

describe("makeRegistrationsService", () => {
  test("list maps every row returned by search", async () => {
    const search = mock(async () => [row, { ...row, regNo: "reg-2026-0002" }]);
    const deps: RegistrationsDeps = { search };
    const service = makeRegistrationsService(deps);

    const result = await service.list({ name: "Alicia" });

    expect(search).toHaveBeenCalledWith({ name: "Alicia" });
    expect(result).toHaveLength(2);
    expect(result[1]?.regNo).toBe("reg-2026-0002");
  });
});
