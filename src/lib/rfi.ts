export type PinLocation = { drawing_id?: string; x?: number; y?: number };
export function isPinned(location?: PinLocation) {
  return !!location?.drawing_id && location.x != null && location.y != null;
}
export function rfiLocation(location: PinLocation | undefined, drawing: string, grid: string) {
  return { drawing_id: location?.drawing_id || drawing || null, gridline_ref: isPinned(location) ? null : grid.trim() || null };
}