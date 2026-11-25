import { describe, expect, it } from "vitest";
import { isPinned, rfiLocation } from "./rfi";

describe("RFI pin location", () => {
  it("never stores manually entered gridlines with a drawing pin", () => {
    expect(rfiLocation({ drawing_id: "sheet-1", x: 0, y: 30 }, "sheet-2", "C2-C3")).toEqual({ drawing_id: "sheet-1", gridline_ref: null });
  });
  it("retains drawing and gridline for a non-pinned register RFI", () => {
    expect(rfiLocation(undefined, "sheet-2", " C2-C3 ")).toEqual({ drawing_id: "sheet-2", gridline_ref: "C2-C3" });
  });
  it("a drawing alone is not a pin", () => {
    expect(isPinned({ drawing_id: "sheet-1" })).toBe(false);
  });
});