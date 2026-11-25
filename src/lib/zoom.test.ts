import { describe, expect, it } from "vitest";
import { doubleTap, pinchStep, zoomAt } from "./zoom";

describe("plan zoom", () => {
  it("keeps the touched point fixed while zooming", () => {
    const v = zoomAt({ x: 0, y: 0, z: 1 }, 2, 100, 50);
    expect(v).toEqual({ x: -100, y: -50, z: 2 });
    // point (100,50) on screen maps to the same sheet point (50,25)*2-100 = 0? check: (100 - x)/z
    expect((100 - v.x) / v.z).toBe(100);
  });
  it("cannot zoom out past fit, and fitting resets position", () => {
    expect(zoomAt({ x: -40, y: -40, z: 2 }, 0.3, 10, 10)).toEqual({ x: 0, y: 0, z: 1 });
  });
  it("pinching apart doubles zoom", () => {
    const v = pinchStep({ x: 0, y: 0, z: 1 }, { d: 100, cx: 50, cy: 50 }, { d: 200, cx: 50, cy: 50 });
    expect(v.z).toBe(2);
  });
  it("double-tap zooms in, second double-tap fits", () => {
    const a = doubleTap({ x: 0, y: 0, z: 1 }, 0, 0);
    expect(a.z).toBe(2.5);
    expect(doubleTap(a, 0, 0)).toEqual({ x: 0, y: 0, z: 1 });
  });
});
