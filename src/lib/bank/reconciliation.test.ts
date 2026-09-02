import { describe, expect, it } from "vitest";
import { pickReconciliationMatch } from "@/lib/bank/reconciliation";

const target = new Date("2026-08-15T00:00:00");

function daysFromTarget(days: number, id = `tx-${days}`) {
  const d = new Date(target);
  d.setDate(d.getDate() + days);
  return { id, date: d };
}

describe("pickReconciliationMatch", () => {
  it("returns null when there are no candidates", () => {
    expect(pickReconciliationMatch([], target)).toBeNull();
  });

  it("returns the only candidate when there is exactly one", () => {
    const candidate = daysFromTarget(1);
    expect(pickReconciliationMatch([candidate], target)).toEqual(candidate);
  });

  it("picks the candidate closest to the target date", () => {
    const far = daysFromTarget(2, "far");
    const near = daysFromTarget(-1, "near");
    const farther = daysFromTarget(-2, "farther");
    expect(pickReconciliationMatch([far, farther, near], target)?.id).toBe("near");
  });

  it("returns null when two candidates are equally close (tie)", () => {
    const before = daysFromTarget(-1, "before");
    const after = daysFromTarget(1, "after");
    expect(pickReconciliationMatch([before, after], target)).toBeNull();
  });

  it("does not treat a tie between the 2nd and 3rd closest as ambiguous", () => {
    const closest = daysFromTarget(0, "closest");
    const tiedSecond = daysFromTarget(-2, "tied-second");
    const tiedThird = daysFromTarget(2, "tied-third");
    expect(
      pickReconciliationMatch([tiedThird, closest, tiedSecond], target)?.id
    ).toBe("closest");
  });

  it("does not mutate the input array", () => {
    const candidates = [daysFromTarget(3, "b"), daysFromTarget(1, "a")];
    const copy = [...candidates];
    pickReconciliationMatch(candidates, target);
    expect(candidates).toEqual(copy);
  });
});
