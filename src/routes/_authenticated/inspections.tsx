import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Minus } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { DeleteMistake } from "@/components/fb/Workflow";
import { Button } from "@/components/ui/button";
import { db, PROJECT_ID, useTable, useRefresh, byId, type Row } from "@/lib/db";
import { INSPECTION_TEMPLATES, inspectionResult, nextNumber, type CheckItem } from "@/lib/workflow";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/inspections")({
  head: () => pageHead("Quality Inspections", "Hold-point checklists before work is covered up; failed items raise snags automatically."),
  component: Inspections,
});

function Inspections() {
  const rows = useTable("site_inspections", { order: "created_at", asc: false });
  const lvQ = useTable("project_levels_zones", { order: "sequence_order" });
  const lv = byId(lvQ.data);
  const snags = useTable("snags");
  const refresh = useRefresh();
  const [tpl, setTpl] = useState(Object.keys(INSPECTION_TEMPLATES)[0]!);
  const [level, setLevel] = useState("");

  async function start() {
    const items: CheckItem[] = INSPECTION_TEMPLATES[tpl]!.map((label) => ({ label, result: null }));
    const { error } = await db.from("site_inspections").insert({ project_id: PROJECT_ID, inspection_number: nextNumber("INS", (rows.data ?? []).map((r) => r.inspection_number)), template: tpl, level_zone_id: level || null, items });
    if (error) { toast.error(error.message); return; }
    toast.success("Inspection started"); refresh("site_inspections");
  }
  async function mark(r: Row, idx: number, result: CheckItem["result"]) {
    const items: CheckItem[] = r.items.map((i: CheckItem, j: number) => (j === idx ? { ...i, result } : i));
    const res = inspectionResult(items);
    const { error } = await db.from("site_inspections").update({ items, result: res }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    if (result === "fail") {
      const { error: e2 } = await db.from("snags").insert({ project_id: PROJECT_ID, snag_number: nextNumber("SN", (snags.data ?? []).map((s) => s.snag_number)), level_zone_id: r.level_zone_id, package_id: r.package_id, defect_description: `${r.inspection_number} ${r.template} failed: ${items[idx]!.label}`, severity: "Major Defect", status: "Open", rectify_by_date: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) });
      if (e2) toast.error(e2.message); else toast.warning("Failed item raised as a snag");
    }
    refresh("site_inspections", "snags");
  }

  return (<>
    <PageTitle title="Quality Inspections" sub="Hold points before concrete, cladding or ceilings close up the work">
      <div className="flex flex-wrap gap-2">
        <select aria-label="Checklist" className="h-9 rounded-md border bg-background px-2 text-sm" value={tpl} onChange={(e) => setTpl(e.target.value)}>{Object.keys(INSPECTION_TEMPLATES).map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="Level" className="h-9 rounded-md border bg-background px-2 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}><option value="">Any level</option>{lvQ.data?.map((l) => <option key={l.id} value={l.id}>{l.level_code}</option>)}</select>
        <Button onClick={start}>Start inspection</Button>
      </div>
    </PageTitle>
    {!rows.data?.length && <p className="text-sm text-muted-foreground">No inspections yet — pick a checklist and start one.</p>}
    <div className="grid gap-3 md:grid-cols-2">
      {rows.data?.map((r) => (
        <div key={r.id} className="rounded-md border bg-card p-3">
          <div className="flex items-center gap-2"><span className="font-mono font-bold">{r.inspection_number}</span><span className="font-medium">{r.template}</span><span className="ml-auto"><StatusBadge value={r.result} /></span></div>
          <p className="text-xs text-muted-foreground">{lv[r.level_zone_id]?.level_code ?? "Any level"} · {r.inspected_at}</p>
          <ul className="mt-2 space-y-1">
            {r.items.map((i: CheckItem, idx: number) => (
              <li key={idx} className="flex items-center gap-2 border-t pt-1 text-sm">
                <span className="flex-1">{i.label}</span>
                {r.result === "In Progress" || i.result === null ? (<>
                  <Button size="icon" variant={i.result === "pass" ? "default" : "outline"} aria-label="Pass" onClick={() => mark(r, idx, "pass")}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant={i.result === "fail" ? "destructive" : "outline"} aria-label="Fail" onClick={() => mark(r, idx, "fail")}><X className="h-4 w-4" /></Button>
                  <Button size="icon" variant={i.result === "na" ? "secondary" : "outline"} aria-label="Not applicable" onClick={() => mark(r, idx, "na")}><Minus className="h-4 w-4" /></Button>
                </>) : <StatusBadge value={i.result === "pass" ? "Passed" : i.result === "fail" ? "Failed" : "N/A"} />}
              </li>
            ))}
          </ul>
          <div className="mt-2"><DeleteMistake table="site_inspections" row={{ ...r, status: r.result }} label={r.inspection_number} /></div>
        </div>
      ))}
    </div>
  </>);
}
