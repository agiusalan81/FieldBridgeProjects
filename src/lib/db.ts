import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Untyped handle: generated types may lag behind the schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export const PROJECT_ID = "00000000-0000-0000-0000-000000000001";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = any;

export function useTable(table: string, opts: { order?: string; asc?: boolean; filter?: [string, string] } = {}) {
  return useQuery<Row[]>({
    queryKey: [table, opts],
    queryFn: async () => {
      let q = db.from(table).select("*");
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
