import { describe, expect, it } from "vitest";
import { findDuplicateSheet } from "./drawing";

describe("duplicate sheet check", () => {
  const sheets = [{ id: "1", sheet_number: "A-104" }];
  it("finds the same sheet number regardless of case or spaces", () => {
    expect(findDuplicateSheet(sheets, " a-104 ")?.id).toBe("1");
  });
  it("allows a new sheet number", () => {
    expect(findDuplicateSheet(sheets, "A-105")).toBeUndefined();
  });
});
