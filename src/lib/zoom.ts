export type View = { x: number; y: number; z: number };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 6;
export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/** Zoom to `nextZ` keeping the point (px, py) — in container coordinates — fixed under the finger/cursor. */
export function zoomAt(v: View, nextZ: number, px: number, py: number): View {
  const z = clampZoom(nextZ);
  if (z === MIN_ZOOM) return { x: 0, y: 0, z };
  const k = z / v.z;
  return { x: px - (px - v.x) * k, y: py - (py - v.y) * k, z };
}

/** Two-finger gesture step: scale by finger spread and move with the fingers' midpoint. */
export function pinchStep(v: View, prev: { d: number; cx: number; cy: number }, next: { d: number; cx: number; cy: number }): View {
  const z = clampZoom(v.z * (next.d / prev.d));
  if (z === MIN_ZOOM) return { x: 0, y: 0, z };
  const k = z / v.z;
  return { x: next.cx - (prev.cx - v.x) * k, y: next.cy - (prev.cy - v.y) * k, z };
}

/** Double-tap: zoom to 2.5x at the tap point, or back to fit when already zoomed. */
export const doubleTap = (v: View, px: number, py: number): View => (v.z > 1.2 ? { x: 0, y: 0, z: 1 } : zoomAt(v, 2.5, px, py));
