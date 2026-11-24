import { describe, it, expect } from "vitest";
import { valuation } from "./db";

const base = { gross_work_value: 0, approved_variations: 0, retention_percent: 5, previous_certified: 0, platform_fee_bps: 7.5, platform_fixed_fee: 299 };

describe("applications for payment", () => {
  it("deducts retention and previously certified to get the amount due", () => {
    const v = valuation({ ...base, gross_work_value: 3820000, approved_variations: 120000, previous_certified: 1757500 });
    expect(v.retention).toBe(197000);
    expect(v.dueThisPeriod).toBe(1985500);
  });
  it("platform fee is fixed sum plus 7.5 bps of the amount certified this period", () => {
    const v = valuation({ ...base, gross_work_value: 2000000, retention_percent: 0 });
    expect(v.residualFee).toBe(1500);
    expect(v.platformFee).toBe(1799);
  });
});
