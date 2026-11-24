import { describe, it, expect } from "vitest";
import { dayworkTotal } from "./db";

describe("daywork sheets", () => {
  it("values labour hours at the rate plus plant and materials", () => {
    expect(dayworkTotal({ labour_hours: 16, labour_rate: 38, plant_cost: 240, materials_cost: 410 })).toBe(1258);
  });
});
