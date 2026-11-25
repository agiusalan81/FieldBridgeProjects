import { describe, expect, it } from "vitest";
import { drawingPinStatus, matchesRegister } from "./issue-register";

describe("Active drawing issues and retained register history", () => {
  const pin = { drawing_id: "drawing-2", pin_type: "rfi", reference_id: "RFI-021", status: "Open" };
  it("hides Closed RFIs without deleting their records", () => {
    const rfis = [{ drawing_id: "drawing-2", rfi_number: "RFI-021", status: "Closed" }];
    expect(drawingPinStatus(pin, rfis, [])).toBe("Resolved");
    expect(rfis).toEqual([{ drawing_id: "drawing-2", rfi_number: "RFI-021", status: "Closed" }]);
  });
  it("hides Answered RFIs", () => {
    expect(drawingPinStatus(pin, [{ drawing_id: "drawing-2", rfi_number: "RFI-021", status: "Answered" }], [])).toBe("Resolved");
  });
  it("hides verified snags but retains rectified snags awaiting inspection", () => {
    const snagPin = { ...pin, pin_type: "snag", reference_id: "SNG-002" };
    expect(drawingPinStatus(snagPin, [], [{ drawing_id: "drawing-2", snag_number: "SNG-002", status: "Verified & Closed" }])).toBe("Resolved");
    expect(drawingPinStatus(snagPin, [], [{ drawing_id: "drawing-2", snag_number: "SNG-002", status: "Fixed - Awaiting Re-inspection" }])).toBe("Open");
  });
  it("hides resolved hazards and observations", () => {
    for (const pin_type of ["safety_hazard", "observation"]) expect(drawingPinStatus({ ...pin, pin_type, status: "Resolved" }, [], [])).toBe("Resolved");
  });
  it("restores reopened linked issues to the plan", () => {
    expect(drawingPinStatus({ ...pin, status: "Resolved" }, [{ drawing_id: "drawing-2", rfi_number: "RFI-021", status: "Open" }], [])).toBe("Open");
  });
  it("does not match a reference on another drawing", () => {
    expect(drawingPinStatus(pin, [{ drawing_id: "other", rfi_number: "RFI-021", status: "Closed" }], [])).toBe("Open");
  });
  it("finds closed RFIs by level, consultant and discipline together", () => {
    const item = { status: "Closed", level_zone_id: "L02", assigned_consultant: "Studio Axis", discipline: "Architectural" };
    const filters = { status: "Closed", level: "L02", party: "Studio Axis", discipline: "Architectural" };
    expect(matchesRegister(item, filters)).toBe(true);
    expect(matchesRegister(item, { ...filters, level: "L01" })).toBe(false);
    expect(matchesRegister(item, { ...filters, party: "Other" })).toBe(false);
    expect(matchesRegister(item, { ...filters, discipline: "Structural" })).toBe(false);
  });
  it("finds rectified snags by subcontractor, level, package and severity", () => {
    const item = { status: "Fixed - Awaiting Re-inspection", level_zone_id: "L02", subcontractor_id: "sub-1", package_id: "MEP", severity: "Major Defect" };
    const filters = { status: "Fixed - Awaiting Re-inspection", level: "L02", party: "sub-1", package: "MEP", severity: "Major Defect" };
    expect(matchesRegister(item, filters)).toBe(true);
    expect(matchesRegister(item, { ...filters, status: "Verified & Closed" })).toBe(false);
    expect(matchesRegister(item, { ...filters, party: "sub-2" })).toBe(false);
    expect(matchesRegister(item, { ...filters, package: "Civils" })).toBe(false);
    expect(matchesRegister(item, { ...filters, severity: "Minor Cosmetic" })).toBe(false);
  });
});