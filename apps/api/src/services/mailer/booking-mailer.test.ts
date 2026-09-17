import { describe, expect, test } from "bun:test";

import { loadTemplate, replaceVariables } from "./index";
import { buildConfirmationVariables } from "./booking-mailer";

const sample = buildConfirmationVariables({
  userName: "Alicia Rao",
  regNumber: "23BCE1234",
  bookingId: "BK-1",
  bookingType: "Solo Mission",
  teamCode: null,
  slotDate: "Friday, Sep 18, 2026",
  slotTime: "2:00 PM - 2:30 PM",
  passUrl: "http://localhost:3000/profile",
  qrToken: "QR-abc123",
  extraVars: {},
});

describe("buildConfirmationVariables", () => {
  test("maps the template-facing keys the .html templates expect", () => {
    expect(sample.user_name).toBe("Alicia Rao");
    expect(sample.registrationNumber).toBe("23BCE1234");
    expect(sample.slotDate).toBe("Friday, Sep 18, 2026");
    expect(sample.slotTime).toBe("2:00 PM - 2:30 PM");
  });

  test("falls back to N/A for legacy rows without a reg number", () => {
    const vars = buildConfirmationVariables({
      userName: "No Reg",
      regNumber: null,
      bookingId: "BK-2",
      bookingType: "Solo Mission",
      teamCode: null,
      slotDate: "d",
      slotTime: "t",
      passUrl: "p",
      qrToken: "q",
      extraVars: {},
    });
    expect(vars.registrationNumber).toBe("N/A");
  });
});

describe("booking email templates", () => {
  for (const template of ["booking-confirmation", "slot-change"]) {
    test(`${template}.html renders with no leftover placeholders and no PASS ID`, async () => {
      const raw = await loadTemplate(template);
      const html = replaceVariables(raw, sample);
      expect(html).not.toContain("{{");
      expect(html).not.toContain("PASS ID");
      expect(html).toContain("Alicia Rao");
      expect(html).toContain("23BCE1234");
    });
  }
});
