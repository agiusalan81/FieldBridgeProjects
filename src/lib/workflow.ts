// Pure construction-workflow rules (tested in workflow.test.ts).
export const OWNER_EMAIL = "superadmin@fieldbridgeapp.com";
const CLOSED = ["Resolved", "Closed", "Verified & Closed", "Approved", "Certified", "Signed", "Passed", "Answered", "Paid"];

/** A record can be deleted as a mistake only by its creator (or the owner) and only before it is resolved/closed. */
export function canDelete(row: { created_by?: string | null; status?: string | null }, me: { id?: string | null | undefined; isOwner?: boolean | undefined }) {
  if (row.status && CLOSED.includes(row.status)) return false;
  if (me.isOwner) return true;
  return !!me.id && row.created_by === me.id;
}

/** Next sequential register number, e.g. VO-007. */
export function nextNumber(prefix: string, existing: (string | null | undefined)[]) {
  const max = existing.reduce((m, s) => { const n = parseInt(String(s ?? "").replace(/\D/g, ""), 10); return Number.isFinite(n) && n > m ? n : m; }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export type CheckItem = { label: string; result: "pass" | "fail" | "na" | null };
/** Any failed item fails the inspection; all answered (pass/N/A) passes it. */
export function inspectionResult(items: CheckItem[]) {
  if (items.some((i) => i.result === "fail")) return "Failed";
  if (items.length && items.every((i) => i.result === "pass" || i.result === "na")) return "Passed";
  return "In Progress";
}

/** Compliance documents: expired after expiry date, "Expiring" within 30 days. */
export function complianceStatus(expiry: string | null | undefined, today = new Date()) {
  if (!expiry) return "Missing";
  const d0 = new Date(today.toDateString()).getTime();
  const days = Math.floor((new Date(expiry).getTime() - d0) / 86400000);
  if (days < 0) return "Expired";
  if (days <= 30) return "Expiring";
  return "Valid";
}

/** Subcontractor payment certificate: certified gross less retention less previously certified. */
export function claimCertificate(c: { certified_gross: number; retention_percent: number; previous_certified: number }) {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const retention = r2(Number(c.certified_gross) * Number(c.retention_percent) / 100);
  const due = r2(Math.max(0, Number(c.certified_gross) - retention - Number(c.previous_certified)));
  return { retention, due };
}

export const INSPECTION_TEMPLATES: Record<string, string[]> = {
  "Pre-Pour Concrete": ["Rebar size & spacing per drawing", "Cover spacers in place", "Formwork clean & braced", "Cast-in items positioned", "Engineer sign-off received"],
  "MEP 1st Fix": ["Containment routes per drawing", "Penetrations sleeved", "Pressure test certificate", "Labelling applied"],
  "Firestopping": ["Approved product used", "Penetrations sealed full depth", "Labels with product & date", "Photos taken"],
  "Waterproofing Membrane": ["Substrate clean & dry", "Laps per manufacturer", "Flood test passed", "Protection board fitted"],
};

/** Extra work / variations above the client's threshold need the client's own sign-off; at or below, the PM can approve. */
export function needsClientApproval(amount: number, threshold: number) {
  return Number(amount) > Number(threshold);
}
