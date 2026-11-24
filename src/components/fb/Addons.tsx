import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BookOpen, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, useTable, useRefresh, PROJECT_ID } from "@/lib/db";

export const ADDONS = {
  books: {
    name: "FieldBridge Books", icon: BookOpen, price: "from €29 / month",
    pitch: "Turn every certified valuation into a compliant VAT invoice — automatically.",
    benefits: ["Client progress invoices drafted the moment a valuation is certified", "Retention held & released tracked per package", "Subcontractor claims checked against daily returns before you pay", "Payments recorded in Books mark certificates Paid here"],
  },
  mail: {
    name: "FieldBridge Mail", icon: Mail, price: "from €12 / month",
    pitch: "Every certificate, Pay Less notice and RFI sent with a timestamped audit trail.",
    benefits: ["Payment certificates & Pay Less notices sent within statutory deadlines", "RFI transmittals threaded into one project inbox", "Delivery & read receipts as contractual evidence", "Branded templates for employer, PQS and trades"],
  },
} as const;
export type AddonKey = keyof typeof ADDONS;

export function useAddons() {
  const q = useTable("project_addons", { filter: ["project_id", PROJECT_ID] });
  const refresh = useRefresh();
  const isOn = (k: AddonKey) => !!q.data?.find((r) => r.addon_key === k)?.active;
  async function toggle(k: AddonKey, active: boolean) {
    const { error } = await db.from("project_addons").upsert(
      { project_id: PROJECT_ID, addon_key: k, active, activated_at: active ? new Date().toISOString() : null },
      { onConflict: "project_id,addon_key" });
    if (error) { toast.error(error.message); return; }
    toast.success(`${ADDONS[k].name} ${active ? "activated" : "turned off"}`);
    refresh("project_addons");
  }
  return { isOn, toggle, loading: q.isLoading };
}

/** Contextual nudge shown where the add-on removes friction. Hidden once active. */
export function AddonNudge({ k, reason }: { k: AddonKey; reason: string }) {
  const { isOn, toggle, loading } = useAddons();
  if (loading || isOn(k)) return null;
  const a = ADDONS[k];
  return (
    <div className="my-4 flex flex-wrap items-center gap-3 rounded-md border-2 border-dashed border-primary bg-card p-4">
      <a.icon className="h-8 w-8 shrink-0 text-primary" />
      <div className="min-w-[200px] flex-1">
        <div className="font-display text-lg font-bold uppercase">{a.name}</div>
        <p className="text-sm text-muted-foreground">{reason}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild><Link to="/addons">Learn more</Link></Button>
        <Button onClick={() => toggle(k, true)}>Activate <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export function AddonCard({ k }: { k: AddonKey }) {
  const { isOn, toggle } = useAddons();
  const a = ADDONS[k]; const on = isOn(k);
  return (
    <div className={`flex flex-col rounded-md border-2 bg-card p-5 ${on ? "border-success" : "border-border"}`}>
      <div className="flex items-center gap-3"><a.icon className="h-9 w-9 text-primary" />
        <div><div className="font-display text-2xl font-bold uppercase">{a.name}</div><div className="text-xs text-muted-foreground">{a.price}</div></div>
        {on && <span className="ml-auto rounded-sm bg-success px-2 py-1 text-xs font-semibold uppercase text-success-foreground">Active</span>}
      </div>
      <p className="mt-3 font-medium">{a.pitch}</p>
      <ul className="mt-3 flex-1 space-y-2 text-sm">{a.benefits.map((b) => <li key={b} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" />{b}</li>)}</ul>
      <Button className="mt-4" variant={on ? "outline" : "default"} onClick={() => toggle(k, !on)}>{on ? "Turn off" : `Activate ${a.name}`}</Button>
    </div>
  );
}
