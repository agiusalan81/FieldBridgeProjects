import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { db, useTable, useRefresh, eur, valuation, finalAccount } from "@/lib/db";

export function PaymentApplications({ projectId }: { projectId?: string }) {
  const apps = useTable("payment_applications", { order: "application_number" });
  const vars = useTable("variations");
  const refresh = useRefresh();
  const list = apps.data ?? [];
  const [open, setOpen] = useState(false);
  const [work, setWork] = useState(0);
  const last = list[list.length - 1];

  async function update(id: string, patch: Record<string, unknown>, msg: string) {
    const { error } = await db.from("payment_applications").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(msg); refresh("payment_applications");
  }

  async function create() {
    if (!projectId) return;
    const prev = last ? valuation(last).netCumulative : 0;
    const { error } = await db.from("payment_applications").insert({
      project_id: projectId, application_number: (last?.application_number ?? 0) + 1,
      period_end: new Date().toISOString().slice(0, 10), gross_work_value: work,
      approved_variations: finalAccount(0, vars.data ?? []).approved, previous_certified: prev,
      retention_percent: last?.retention_percent ?? 5, platform_fee_bps: last?.platform_fee_bps ?? 7.5, platform_fixed_fee: last?.platform_fixed_fee ?? 299,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Application for payment created"); setOpen(false); refresh("payment_applications");
  }

  return (
    <>
      <div className="mb-2 mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase">Applications for Payment</h2>
        <Button onClick={() => { setWork(Number(last?.gross_work_value ?? 0)); setOpen(true); }}>New valuation</Button>
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-shell text-left text-xs uppercase tracking-wide text-shell-foreground">
            <tr><th className="p-3">No.</th><th>Period end</th><th className="text-right">Gross (work + VOs)</th><th className="text-right">Retention</th><th className="text-right">Less previous</th><th className="text-right">Due this period</th><th className="text-right">Platform fee</th><th>Status</th><th>FieldBridge Books</th><th /></tr>
          </thead>
          <tbody>
            {list.map((a) => {
              const v = valuation(a);
              return (
                <tr key={a.id} className="border-t align-top">
                  <td className="p-3 font-mono font-bold">AFP-{String(a.application_number).padStart(2, "0")}</td>
                  <td className="py-3 font-mono">{a.period_end}</td>
                  <td className="py-3 text-right font-mono">{eur(v.gross)}</td>
                  <td className="py-3 text-right font-mono">−{eur(v.retention)} <span className="text-xs text-muted-foreground">({a.retention_percent}%)</span></td>
                  <td className="py-3 text-right font-mono">−{eur(a.previous_certified)}</td>
                  <td className="py-3 text-right font-mono font-bold">{eur(v.dueThisPeriod)}</td>
                  <td className="py-3 text-right font-mono"><div>{eur(v.platformFee)}</div><div className="text-xs text-muted-foreground">{eur(a.platform_fixed_fee)} + {a.platform_fee_bps} bps</div></td>
                  <td className="py-3"><StatusBadge value={a.status} /></td>
                  <td className="py-3 text-xs">{a.books_sync_status}{a.books_reference && <div className="font-mono">{a.books_reference}</div>}</td>
                  <td className="py-3 pr-3"><div className="flex gap-1">
                    {a.status === "Draft" && <Button size="sm" onClick={() => update(a.id, { status: "Submitted" }, "Submitted to employer")}>Submit</Button>}
                    {a.status === "Submitted" && <Button size="sm" onClick={() => update(a.id, { status: "Certified" }, "Certified")}>Certify</Button>}
                    {a.status === "Certified" && a.books_sync_status !== "Synced" && <Button size="sm" variant="outline" onClick={() => update(a.id, { books_sync_status: "Queued for Books" }, "Queued for FieldBridge Books")}>Send to Books</Button>}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New application for payment</DialogTitle></DialogHeader>
          <Label htmlFor="work">Cumulative value of work executed (€)</Label>
          <Input id="work" type="number" value={work} onChange={(e) => setWork(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">Approved variations, retention and previously certified amounts are added automatically.</p>
          <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
