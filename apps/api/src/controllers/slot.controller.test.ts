import { describe, expect, test } from "bun:test";

import { computeRebookSeedCount } from "./slot.controller";

const slot = (id: string) => id;

describe("computeRebookSeedCount", () => {
  test("fresh user with no history starts at 0", () => {
    expect(computeRebookSeedCount([], slot("s1"))).toBe(0);
  });

  test("re-booking the same slot after cancel is free", () => {
    expect(
      computeRebookSeedCount(
        [{ slotId: "a", slotChangeCount: 2, cancelledAt: new Date() }],
        slot("a"),
      ),
    ).toBe(2);
  });

  test("re-booking a different slot after cancel consumes one change", () => {
    expect(
      computeRebookSeedCount(
        [{ slotId: "a", slotChangeCount: 1, cancelledAt: new Date() }],
        slot("b"),
      ),
    ).toBe(2);
  });

  test("inherits the highest count across all past rows", () => {
    const history = [
      { slotId: "a", slotChangeCount: 1, cancelledAt: new Date("2026-01-01") },
      { slotId: "b", slotChangeCount: 2, cancelledAt: new Date("2026-02-01") },
    ];
    // Most recent slot was b; re-booking b is free but keeps count 2.
    expect(computeRebookSeedCount(history, slot("b"))).toBe(2);
    // A new slot consumes one more.
    expect(computeRebookSeedCount(history, slot("c"))).toBe(3);
  });

  test("blocks re-book when the allowance is exhausted", () => {
    // At 3/3, even the same slot re-book is capped (seed would be 3, allowed
    // only when it does not exceed the max — moving anywhere else is null).
    expect(
      computeRebookSeedCount(
        [{ slotId: "a", slotChangeCount: 3, cancelledAt: new Date() }],
        slot("b"),
      ),
    ).toBeNull();
    // Same slot at exactly max stays allowed.
    expect(
      computeRebookSeedCount(
        [{ slotId: "a", slotChangeCount: 3, cancelledAt: new Date() }],
        slot("a"),
      ),
    ).toBe(3);
  });

  test("cancel + rebook can never loop past the cap", () => {
    // Simulate the exploit: repeated cancel → different slot.
    let history = [{ slotId: "a", slotChangeCount: 0, cancelledAt: new Date() }];
    const slots = ["b", "c", "d", "e", "f"];
    const seeds: Array<number | null> = [];
    for (const s of slots) {
      const seed = computeRebookSeedCount(history, slot(s));
      seeds.push(seed);
      if (seed !== null) {
        history = [{ slotId: s, slotChangeCount: seed, cancelledAt: new Date() }];
      }
    }
    expect(seeds).toEqual([1, 2, 3, null, null]);
  });
});
