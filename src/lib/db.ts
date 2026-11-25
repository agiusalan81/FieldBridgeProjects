import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Untyped handle: generated types may lag behind the schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";
const ACTIVE_KEY = "fbp.activeProject";
/** Active project for every screen (live binding; switching reloads the app). */
export let PROJECT_ID: string =
  (typeof window !== "undefined" && window.localStorage.getItem(ACTIVE_KEY)) || DEFAULT_PROJECT_ID;
export function setActiveProject(id: string) {
  PROJECT_ID = id;
  window.localStorage.setItem(ACTIVE_KEY, id);
  window.location.assign("/");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = any;

/** Tables carrying project_id are always scoped to the active project. */
const PROJECT_SCOPED = new Set(["daily_site_diaries", "daywork_sheets", "drawings", "payment_applications", "project_addons", "project_levels_zones", "rfis", "site_inspections", "snags", "subcontractor_claims", "subcontractors", "submittals", "trade_packages", "variations", "extra_work_quotes"]);

export function useTable(table: string, opts: { order?: string; asc?: boolean; filter?: [string, string] } = {}) {
  return useQuery<Row[]>({
    queryKey: [table, opts, PROJECT_SCOPED.has(table) ? PROJECT_ID : null],
    queryFn: async () => {
      let q = db.from(table).select("*");
      if (PROJECT_SCOPED.has(table)) q = q.eq("project_id", PROJECT_ID);
      if (opts.filter) q = q.eq(opts.filter[0], opts.filter[1]);
      if (opts.order) q = q.order(opts.order, { ascending: opts.asc ?? true });
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRefresh() {
  const qc = useQueryClient();
  return (...tables: string[]) => tables.forEach((t) => qc.invalidateQueries({ queryKey: [t] }));
}

export const eur = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n ?? 0));

export const byId = (rows: Row[] | undefined) => Object.fromEntries((rows ?? []).map((r: Row) => [r.id, r]));

export const isOverdue = (r: Row) =>
  !!r.date_required && !["Answered", "Closed"].includes(r.status) && new Date(r.date_required) < new Date(new Date().toDateString());

/** Anticipated Final Account = original contract sum + approved employer amounts of Approved variations. */
export function finalAccount(original: number, variations: Row[]) {
  const approved = variations.filter((v) => v.status === "Approved").reduce((s, v) => s + Number(v.approved_employer_amount ?? 0), 0);
  return { approved, total: Number(original) + approved };
}

/** Interim valuation: cumulative gross less retention less previously certified = due this period.
 *  Platform fee = fixed monthly licence + basis points (1 bp = 0.01%) on the amount certified this period. */
export function valuation(a: { gross_work_value: number; approved_variations: number; retention_percent: number; previous_certified: number; platform_fee_bps: number; platform_fixed_fee: number }) {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const gross = Number(a.gross_work_value) + Number(a.approved_variations);
  const retention = r2(gross * Number(a.retention_percent) / 100);
  const netCumulative = r2(gross - retention);
  const dueThisPeriod = r2(Math.max(0, netCumulative - Number(a.previous_certified)));
  const residualFee = r2(dueThisPeriod * Number(a.platform_fee_bps) / 10000);
  const platformFee = r2(Number(a.platform_fixed_fee) + residualFee);
  return { gross, retention, netCumulative, dueThisPeriod, residualFee, platformFee };
}

/** Daywork sheet value = labour hours × rate + plant + materials. */
export function dayworkTotal(d: { labour_hours: number; labour_rate: number; plant_cost: number; materials_cost: number }) {
  return Math.round((Number(d.labour_hours) * Number(d.labour_rate) + Number(d.plant_cost) + Number(d.materials_cost)) * 100) / 100;
}
