import { describe, it, expect } from "vitest";
import { estimateLine, estimateTotals } from "./estimate";
describe("estimate", () => {
  it("uncommitted line forecasts at budget", () => expect(estimateLine({ section: "F", budget: 380000, committed: 0 }).variance).toBe(0));
  it("committed over budget shows overspend", () => expect(estimateLine({ section: "A", budget: 500000, committed: 512000 }).variance).toBe(12000));
  it("totals add approved variations to forecast final", () => {
    const t = estimateTotals([{ section: "A", budget: 100, committed: 90 }, { section: "B", budget: 50, committed: 0 }], 20);
    expect(t.forecast).toBe(140); expect(t.forecastFinal).toBe(160); expect(t.variance).toBe(-10);
  });
});
