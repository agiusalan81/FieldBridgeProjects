import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, PROJECT_ID, useTable, useRefresh } from "@/lib/db";
import { nextNumber } from "@/lib/workflow";
import { isPinned, rfiLocation } from "@/lib/rfi";
import { saveSiteRecord, type SiteWrite } from "@/lib/offline";

type Kind = "rfi" | "snag" | "notice";
const DISCIPLINES = ["Architectural", "Structural", "MEP - Mechanical", "MEP - Electrical", "Civils", "Landscape", "Other"];
export function QuickCreate({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: { kind?: Kind; drawing_id?: string; x?: number; y?: number; onCreated?: (kind: Kind, ref: string) => void } }) {
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "rfi");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [level, setLevel] = useState("");
  const [grid, setGrid] = useState("");
  const [pkg, setPkg] = useState("");
  const [severity, setSeverity] = useState("Major Defect");
  const [discipline, setDiscipline] = useState("");
  const [consultant, setConsultant] = useState("");
  const [impact, setImpact] = useState("0");
  const [cost, setCost] = useState("None");
  const [required, setRequired] = useState(() => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
  const [drawing, setDrawing] = useState("");
  const [saving, setSaving] = useState(false);
  const levels = useTable("project_levels_zones", { order: "sequence_order" });
  const pkgs = useTable("trade_packages", { order: "package_code" });
  const subs = useTable("subcontractors");
  const rfis = useTable("rfis");
  const snags = useTable("snags");
  const drawings = useTable("drawings", { order: "sheet_number" });
  const refresh = useRefresh();
  const k = initial?.kind ?? kind;
  const pinned = isPinned(initial);
  const sheet = drawings.data?.find((d) => d.id === (initial?.drawing_id || drawing));

  async function save() {
    if (!title.trim()) { toast.error("Add a title / description"); return; }
    if (k === "rfi" && (!required || !Number.isFinite(Number(impact)) || Number(impact) < 0)) { toast.error("Add a required date and a valid programme impact"); return; }
    setSaving(true);
    try {
      let ref = "Notice";
      if (k === "notice") {
        if (!navigator.onLine) throw new Error("Delay notices require a connection. Your text is still here.");
        const { data, error } = await db.from("daily_site_diaries").update({ critical_delays: title + (details ? ` — ${details}` : "") }).eq("project_id", PROJECT_ID).eq("log_date", new Date().toISOString().slice(0, 10)).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("Create today's diary before adding a delay notice.");
        toast.success("Notice saved");
      } else {
        const writes: SiteWrite[] = [];
        if (k === "rfi") {
          ref = nextNumber("RFI", (rfis.data ?? []).map((r) => r.rfi_number));
          writes.push({ table: "rfis", row: { project_id: PROJECT_ID, rfi_number: ref, title: title.trim(), query_details: details, level_zone_id: level || null, ...rfiLocation(initial, drawing, grid), status: "Open", date_required: required, discipline: discipline || sheet?.discipline || "Architectural", assigned_consultant: consultant.trim() || null, programme_impact_days: Number(impact), cost_impact: cost } });
        } else {
          ref = nextNumber("SN", (snags.data ?? []).map((r) => r.snag_number));
          const sub = subs.data?.find((s) => s.package_id === pkg);
          writes.push({ table: "snags", row: { project_id: PROJECT_ID, snag_number: ref, defect_description: title + (details ? ` — ${details}` : ""), level_zone_id: level || null, ...rfiLocation(initial, "", grid), package_id: pkg || null, subcontractor_id: sub?.id ?? null, severity, x_percent: initial?.x ?? null, y_percent: initial?.y ?? null, rectify_by_date: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) } });
        }
        if (pinned) writes.push({ table: "drawing_pins", row: { drawing_id: initial?.drawing_id, pin_type: k, x_percent: initial?.x, y_percent: initial?.y, reference_id: ref, note: title } });
        const result = await saveSiteRecord(PROJECT_ID, writes);
        ref = result.ref;
        toast.success(result.queued ? `${ref} saved on this device · awaiting sync` : `${ref} created`);
      }
      refresh("rfis", "snags", "drawing_pins", "daily_site_diaries");
      initial?.onCreated?.(k, ref);
      setTitle(""); setDetails(""); setGrid(""); setConsultant(""); setImpact("0"); setCost("None"); setDrawing(""); setLevel(""); setDiscipline("");
      onOpenChange(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : String((error as { message?: string }).message ?? "Could not save. Your entries are still here.")); }
    finally { setSaving(false); }
  }

  return <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
    <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display text-2xl uppercase">{k === "rfi" ? "New RFI" : "New site record"}</DialogTitle></DialogHeader>
      {!initial?.kind && <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="rfi">RFI</TabsTrigger><TabsTrigger value="snag">Snag</TabsTrigger><TabsTrigger value="notice">Delay Notice</TabsTrigger></TabsList></Tabs>}
      <div className="grid gap-3">
        {pinned && <p className="text-sm font-medium">{sheet?.sheet_number ?? "Drawing"} · Pin {initial?.x}%, {initial?.y}%</p>}
        <div><Label htmlFor="record-title">{k === "snag" ? "Defect" : k === "rfi" ? "RFI title" : "Delay / stoppage"}</Label><Input id="record-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label htmlFor="record-details">{k === "rfi" ? "Query details" : "Details"}</Label><Textarea id="record-details" value={details} onChange={(e) => setDetails(e.target.value)} /></div>
        {k !== "notice" && <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Level / Zone</Label><Select value={level || "__none"} onValueChange={(v) => setLevel(v === "__none" ? "" : v)}><SelectTrigger aria-label="Level / Zone"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="__none">No specific level</SelectItem>{levels.data?.map((l) => <SelectItem key={l.id} value={l.id}>{l.level_code}</SelectItem>)}</SelectContent></Select></div>
          {!pinned && <div><Label htmlFor="record-grid">Gridline</Label><Input id="record-grid" placeholder="e.g. Grids C2-C3" value={grid} onChange={(e) => setGrid(e.target.value)} /></div>}
        </div>}
        {k === "rfi" && <>
          {!pinned && <div><Label>Drawing (optional)</Label><Select value={drawing || "__none"} onValueChange={(v) => setDrawing(v === "__none" ? "" : v)}><SelectTrigger aria-label="Drawing"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none">No drawing</SelectItem>{drawings.data?.map((d) => <SelectItem key={d.id} value={d.id}>{d.sheet_number} · {d.sheet_title}</SelectItem>)}</SelectContent></Select></div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Discipline</Label><Select value={discipline || sheet?.discipline || "Architectural"} onValueChange={setDiscipline}><SelectTrigger aria-label="Discipline"><SelectValue /></SelectTrigger><SelectContent>{DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="rfi-consultant">Assigned consultant</Label><Input id="rfi-consultant" value={consultant} onChange={(e) => setConsultant(e.target.value)} /></div>
            <div><Label htmlFor="rfi-impact">Programme impact (days)</Label><Input id="rfi-impact" type="number" min="0" step="1" value={impact} onChange={(e) => setImpact(e.target.value)} /></div>
            <div><Label>Cost impact</Label><Select value={cost} onValueChange={setCost}><SelectTrigger aria-label="Cost impact"><SelectValue /></SelectTrigger><SelectContent>{["None", "Potential", "Confirmed"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="rfi-required">Date required</Label><Input id="rfi-required" type="date" value={required} onChange={(e) => setRequired(e.target.value)} /></div>
          </div>
        </>}
        {k === "snag" && <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Trade package</Label><Select value={pkg} onValueChange={setPkg}><SelectTrigger aria-label="Trade package"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{pkgs.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.package_code} {p.package_name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Severity</Label><Select value={severity} onValueChange={setSeverity}><SelectTrigger aria-label="Severity"><SelectValue /></SelectTrigger><SelectContent>{["Critical / Life Safety", "Major Defect", "Minor Cosmetic"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        </div>}
        <Button size="lg" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
