import { createFileRoute } from "@tanstack/react-router";
import { ItemChat, RequestSignoff } from "@/components/fb/Collab";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { SignaturePad } from "@/components/fb/SignaturePad";
import { Button } from "@/components/ui/button";
import { DeleteMistake, ToVariation } from "@/components/fb/Workflow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, useTable, useRefresh, byId, eur, dayworkTotal, PROJECT_ID } from "@/lib/db";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/daywork")({
  head: () => pageHead("Daywork Sheets", "Record daywork labour, plant and materials and get them countersigned on site by finger or stylus."),
  component: Daywork,
});

const blank = { description: "", subcontractor_id: "", labour_hours: "", labour_rate: "", plant_cost: "", materials_cost: "" };

function Daywork() {
  const sheets = useTable("daywork_sheets", { order: "sheet_number", asc: false });
  const subsQ = useTable("subcontractors", { order: "company_name" });
  const subs = byId(subsQ.data);
  const refresh = useRefresh();
  const [form, setForm] = useState(blank);
  const [signId, setSignId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const rows = sheets.data ?? [];
  const sel = rows.find((r) => r.id === signId);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const n = `DW-${String(rows.length + 1).padStart(3, "0")}`;
    const { error } = await db.from("daywork_sheets").insert({
      project_id: PROJECT_ID, sheet_number: n, description: form.description, subcontractor_id: form.subcontractor_id || null,
      labour_hours: Number(form.labour_hours || 0), labour_rate: Number(form.labour_rate || 0), plant_cost: Number(form.plant_cost || 0), materials_cost: Number(form.materials_cost || 0),
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`${n} recorded`); setForm(blank); refresh("daywork_sheets");
  }

  async function sign() {
    if (!sig || !name.trim()) { toast.error("Add your name and signature"); return; }
    const { error } = await db.from("daywork_sheets").update({ status: "Signed", signed_by: name, signature_data_url: sig, signed_at: new Date().toISOString() }).eq("id", signId);
    if (error) { toast.error(error.message); return; }
    toast.success("Daywork sheet signed"); setSignId(null); setName(""); setSig(null); refresh("daywork_sheets");
  }

  const signedTotal = rows.filter((r) => r.status === "Signed").reduce((s, r) => s + dayworkTotal(r), 0);

  return (
    <>
      <PageTitle title="Daywork Sheets" sub={`${rows.length} sheets · ${eur(signedTotal)} signed, ready for the next valuation`} />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start gap-3 rounded-md border bg-card p-4">
              <div className="min-w-[200px] flex-1">
                <div className="flex items-center gap-2"><span className="font-mono font-bold">{r.sheet_number}</span><StatusBadge value={r.status} /></div>
                <p className="mt-1 text-sm font-medium">{r.description}</p>
                <p className="text-xs text-muted-foreground">{r.work_date} · {subs[r.subcontractor_id]?.company_name ?? "Own labour"} · {r.labour_hours}h × {eur(r.labour_rate)} + plant {eur(r.plant_cost)} + materials {eur(r.materials_cost)}</p>
                {r.signature_data_url && <div className="mt-2 flex items-center gap-2 text-xs"><img src={r.signature_data_url} alt={`Signature of ${r.signed_by}`} className="h-10 rounded border bg-background" />Signed by <b>{r.signed_by}</b></div>}
              </div>
              <div className="text-right"><div className="font-display text-2xl font-bold">{eur(dayworkTotal(r))}</div>
                {r.status !== "Signed" && <Button size="sm" className="mt-1" onClick={() => setSignId(r.id)}>Sign off</Button>}
                <div className="mt-1 flex flex-wrap justify-end gap-1">{r.status === "Signed" && <ToVariation source="daywork" sourceId={r.id} linkTable="daywork_sheets" title={`Daywork ${r.sheet_number}: ${r.description}`} amount={dayworkTotal(r)} disabled={!!r.variation_id} />}<ItemChat itemType="daywork" itemId={r.id} label={r.sheet_number} />{r.status !== "Signed" && <RequestSignoff itemType="Daywork" itemId={r.id} title={`Daywork ${r.sheet_number}`} summary={r.description} amount={dayworkTotal(r)} />}<DeleteMistake table="daywork_sheets" row={r} label={r.sheet_number} /></div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={create} className="space-y-2 rounded-md border bg-card p-4">
          <h2 className="font-display text-xl font-bold uppercase">New daywork sheet</h2>
          <Textarea required placeholder="Work carried out & instruction reference" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select aria-label="Subcontractor" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={form.subcontractor_id} onChange={(e) => setForm({ ...form, subcontractor_id: e.target.value })}>
            <option value="">Own labour</option>{subsQ.data?.map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            {([["labour_hours", "Labour hours"], ["labour_rate", "Rate €/h"], ["plant_cost", "Plant €"], ["materials_cost", "Materials €"]] as const).map(([k, l]) => (
              <Input key={k} type="number" min="0" step="any" placeholder={l} aria-label={l} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            ))}
          </div>
          <Button type="submit" className="w-full">Record daywork</Button>
        </form>
      </div>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSignId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display uppercase">Sign off {sel?.sheet_number}</DialogTitle></DialogHeader>
          <p className="text-sm">{sel?.description} — <b>{sel && eur(dayworkTotal(sel))}</b></p>
          <Input placeholder="Your name (Clerk of Works / Site Manager)" aria-label="Signer name" value={name} onChange={(e) => setName(e.target.value)} />
          <SignaturePad onChange={setSig} />
          <Button onClick={sign}>Confirm signature</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
