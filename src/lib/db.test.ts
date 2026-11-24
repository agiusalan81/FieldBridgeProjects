import { describe, it, expect } from "vitest";
import { finalAccount } from "./db";

describe("anticipated final account", () => {
  it("adds only approved variations to the €24.5M contract sum", () => {
    const r = finalAccount(24500000, [
      { status: "Approved", approved_employer_amount: 161000 },
      { status: "Submitted to PQS / Employer", approved_employer_amount: 46200 },
      { status: "Approved", approved_employer_amount: 24900 },
    ]);
    expect(r.approved).toBe(185900);
    expect(r.total).toBe(24685900);
  });
});
