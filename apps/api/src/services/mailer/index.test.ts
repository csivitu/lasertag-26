import { describe, expect, mock, test } from "bun:test";

import { isTransientMailError, sendWithRetry } from "./index";

const transientError = () => {
  const err = new Error("connection reset") as Error & { code: string };
  err.code = "ECONNRESET";
  return err;
};

const permanentError = () => {
  const err = new Error("mailbox unavailable") as Error & { responseCode: number };
  err.responseCode = 550;
  return err;
};

describe("isTransientMailError", () => {
  test("treats network blips and 4xx SMTP replies as transient", () => {
    expect(isTransientMailError(transientError())).toBe(true);
    const grey = new Error("greylisted") as Error & { responseCode: number };
    grey.responseCode = 451;
    expect(isTransientMailError(grey)).toBe(true);
  });

  test("treats 5xx bounces and unknown shapes as permanent", () => {
    expect(isTransientMailError(permanentError())).toBe(false);
    expect(isTransientMailError(new Error("nope"))).toBe(false);
    expect(isTransientMailError(null)).toBe(false);
  });
});

describe("sendWithRetry", () => {
  test("succeeds after transient failures without real waiting", async () => {
    const send = mock(async () => {
      if (send.mock.calls.length < 3) throw transientError();
      return { messageId: "abc123" };
    });
    const delays: number[] = [];
    const recordingSleep = mock(async (ms: number) => {
      delays.push(ms);
    });

    const result = await sendWithRetry(send, { sleepFn: recordingSleep });

    expect(result).toEqual({ messageId: "abc123" });
    expect(send).toHaveBeenCalledTimes(3);
    expect(recordingSleep).toHaveBeenCalledTimes(2);
    const [firstDelay, secondDelay] = delays;
    expect(firstDelay).toBeGreaterThanOrEqual(1000);
    expect(firstDelay).toBeLessThan(1250);
    expect(secondDelay).toBeGreaterThanOrEqual(2000);
    expect(secondDelay).toBeLessThan(2250);
  });

  test("does not retry permanent failures", async () => {
    const send = mock(async () => {
      throw permanentError();
    });
    const sleepFn = mock(async () => {});

    await expect(sendWithRetry(send, { sleepFn })).rejects.toThrow("mailbox unavailable");
    expect(send).toHaveBeenCalledTimes(1);
    expect(sleepFn).not.toHaveBeenCalled();
  });

  test("throws after exhausting attempts on persistent blips", async () => {
    const send = mock(async () => {
      throw transientError();
    });
    const sleepFn = mock(async () => {});

    await expect(sendWithRetry(send, { sleepFn })).rejects.toThrow("connection reset");
    expect(send).toHaveBeenCalledTimes(3);
    expect(sleepFn).toHaveBeenCalledTimes(2);
  });
});
