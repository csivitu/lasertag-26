import { describe, expect, test } from "bun:test";

import {
  staffSessionHeaders,
  toAuthCookieHeader,
  toStaffSetCookies,
} from "./auth-cookies";

describe("staff cookie isolation", () => {
  test("outgoing: rewrites better-auth Set-Cookie names, leaves others alone", () => {
    expect(
      toStaffSetCookies([
        "better-auth.session_token=abc; Path=/; HttpOnly",
        "better-auth.session_data=xyz; Path=/",
        "unrelated=1; Path=/",
      ]),
    ).toEqual([
      "staff.session_token=abc; Path=/; HttpOnly",
      "staff.session_data=xyz; Path=/",
      "unrelated=1; Path=/",
    ]);
  });

  test("incoming: rewrites staff names back, ignores participant cookies", () => {
    expect(toAuthCookieHeader("staff.session_token=abc; better-auth.session_token=def")).toBe(
      "better-auth.session_token=abc; better-auth.session_token=def",
    );
  });

  test("incoming: values containing dots are untouched, only names translate", () => {
    expect(toAuthCookieHeader("staff.session_token=a.b.c")).toBe(
      "better-auth.session_token=a.b.c",
    );
  });

  test("incoming: undefined and empty pass through", () => {
    expect(toAuthCookieHeader(undefined)).toBeUndefined();
    expect(toAuthCookieHeader("")).toBe("");
  });

  test("round trip: staff namespace survives both directions", () => {
    const outgoing = toStaffSetCookies(["better-auth.session_token=tok; Path=/"]);
    expect(toAuthCookieHeader(outgoing[0])).toBe("better-auth.session_token=tok; Path=/");
  });

  test("staffSessionHeaders rewrites the cookie header in place", () => {
    const headers = new Headers({ cookie: "staff.session_token=tok" });
    staffSessionHeaders(headers);
    expect(headers.get("cookie")).toBe("better-auth.session_token=tok");
  });
});
