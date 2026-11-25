type LinkedIssue = { drawing_id?: string | null; status: string; rfi_number?: string; snag_number?: string };
export type IssuePin = { drawing_id: string; pin_type: string; reference_id?: string | null; status: string };

/** Linked registers are authoritative, including when a previously closed item is reopened. */
export function drawingPinStatus(pin: IssuePin, rfis: LinkedIssue[], snags: LinkedIssue[]) {
  const issues = pin.pin_type === "rfi" ? rfis : pin.pin_type === "snag" ? snags : [];
  const item = issues.find((r) => r.drawing_id === pin.drawing_id &&
    (pin.pin_type === "rfi" ? r.rfi_number : r.snag_number) === pin.reference_id);
  if (!item) return pin.status;
  return ["Answered", "Closed", "Verified & Closed"].includes(item.status) ? "Resolved" : "Open";
}

export type RegisterFilters = { status: string; level: string; party: string; discipline?: string; package?: string; severity?: string };
type RegisterItem = { status: string; level_zone_id?: string | null; assigned_consultant?: string | null; subcontractor_id?: string | null; discipline?: string | null; package_id?: string | null; severity?: string | null };
export function matchesRegister(item: RegisterItem, filters: RegisterFilters, status = item.status) {
  return (filters.status === "All" || status === filters.status) &&
    (filters.level === "all" || item.level_zone_id === filters.level) &&
    (filters.party === "all" || item.assigned_consultant === filters.party || item.subcontractor_id === filters.party) &&
    (!filters.discipline || filters.discipline === "all" || item.discipline === filters.discipline) &&
    (!filters.package || filters.package === "all" || item.package_id === filters.package) &&
    (!filters.severity || filters.severity === "all" || item.severity === filters.severity);
}