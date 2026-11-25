import { describe, it, expect } from "vitest";
import { canDelete, nextNumber, inspectionResult, complianceStatus, claimCertificate } from "./workflow";

describe("workflow rules", () => {
  it("only the creator can delete an open record", () => {
    expect(canDelete({ created_by: "a", status: "Open" }, { id: "a" })).toBe(true);
    expect(canDelete({ created_by: "a", status: "Open" }, { id: "b" })).toBe(false);
  });
  it("resolved records cannot be deleted, even by the creator", () => {
    expect(canDelete({ created_by: "a", status: "Resolved" }, { id: "a" })).toBe(false);
  });
  it("owner can delete any open record", () => {
    expect(canDelete({ created_by: "a", status: "Open" }, { id: "z", isOwner: true })).toBe(true);
  });
  it("numbers registers sequentially", () => {
    expect(nextNumber("VO", ["VO-001", "VO-006"])).toBe("VO-007");
  });
  it("one failed check fails the inspection", () => {
    expect(inspectionResult([{ label: "a", result: "pass" }, { label: "b", result: "fail" }])).toBe("Failed");
    expect(inspectionResult([{ label: "a", result: "pass" }, { label: "b", result: "na" }])).toBe("Passed");
    expect(inspectionResult([{ label: "a", result: "pass" }, { label: "b", result: null }])).toBe("In Progress");
  });
  it("compliance expires after the expiry date and warns within 30 days", () => {
    const t = new Date("2026-06-01");
    expect(complianceStatus("2026-05-31", t)).toBe("Expired");
    expect(complianceStatus("2026-06-20", t)).toBe("Expiring");
    expect(complianceStatus("2026-08-01", t)).toBe("Valid");
  });
  it("subcontractor certificate deducts retention and previous payments", () => {
    expect(claimCertificate({ certified_gross: 100000, retention_percent: 5, previous_certified: 20000 })).toEqual({ retention: 5000, due: 75000 });
  });
});
