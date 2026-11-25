export const sheetKey = (n: string) => n.trim().toLowerCase();

/** An existing sheet with the same number in this project, if any. */
export function findDuplicateSheet<T extends { sheet_number: string }>(sheets: T[] | undefined, number: string): T | undefined {
  const k = sheetKey(number);
  return k ? sheets?.find((s) => sheetKey(s.sheet_number) === k) : undefined;
}
