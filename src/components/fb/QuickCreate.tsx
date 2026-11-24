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

type Kind = "rfi" | "snag" | "notice";

export function QuickCreate({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: { kind?: Kind; drawing_id?: string; x?: number; y?: number; onCreated?: (kind: Kind, ref: string) => void } }) {
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "rfi");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [level, setLevel] = useState("");
  const [grid, setGrid] = useState("");
  const [pkg, setPkg] = useState("");
  const [severity, setSeverity] = useState("Major Defect");
  const [saving, setSaving] = useState(false);
  const levels = useTable("project_levels_zones", { order: "sequence_order" });
  const pkgs = useTable("trade_packages", { order: "package_code" });
  const subs = useTable("subcontractors");
  const rfis = useTable("rfis");
  const snags = useTable("snags");
  const refresh = useRefresh();
  const k = initial?.kind ?? kind;

  const next = (rows: { [k: string]: string }[] | undefined, field: string, prefix: string) => {
    const max = Math.max(0, ...(rows ?? []).map((r) => parseInt(String(r[field]).replace(/\D/g, "")) || 0));
    return `${prefix}-${String(max + 1).padStart(3, "0")}`;
  };

  async function save() {
    if (!title.trim()) { toast.error("Add a title / description"); return; }
    setSaving(true);
    let ref = "";
    let error;
    if (k === "rfi") {
      ref = next(rfis.data, "rfi_number", "RFI");
      ({ error } = await db.from("rfis").insert({ project_id: PROJECT_ID, rfi_number: ref, title, query_details: details, level_zone_id: level || null, gridline_ref: grid, drawing_id: initial?.drawing_id ?? null, status: "Open", date_required: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) }));
    } else if (k === "snag") {
      ref = next(snags.data, "snag_number", "SN");
      const sub = subs.data?.find((s) => s.package_id === pkg);
      ({ error } = await db.from("snags").insert({ project_id: PROJECT_ID, snag_number: ref, defect_description: title + (details ? ` — ${details}` : ""), level_zone_id: level || null, gridline_ref: grid, package_id: pkg || null, subcontractor_id: sub?.id ?? null, severity, drawing_id: initial?.drawing_id ?? null, x_percent: initial?.x ?? null, y_percent: initial?.y ?? null, rectify_by_date: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) }));
    } else {
      ({ error } = await db.from("daily_site_diaries").update({ critical_delays: title + (details ? ` — ${details}` : "") }).eq("project_id", PROJECT_ID).eq("log_date", new Date().toISOString().slice(0, 10)));
      ref = "Notice";
    }
    if (!error && initial?.drawing_id && initial.x != null && k !== "notice") {
      ({ error } = await db.from("drawing_pins").insert({ drawing_id: initial.drawing_id, pin_type: k, x_percent: initial.x, y_percent: initial.y, reference_id: ref, note: title }));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ref} created`);
    refresh("rfis", "snags", "drawing_pins", "daily_site_diaries");
    initial?.onCreated?.(k, ref);
    setTitle(""); setDetails(""); setGrid("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">New site record</DialogTitle></DialogHeader>
        {!initial?.kind && (
          <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="rfi">RFI</TabsTrigger><TabsTrigger value="snag">Snag</TabsTrigger><TabsTrigger value="notice">Delay Notice</TabsTrigger></TabsList>
          </Tabs>
        )}
        <div className="grid gap-3">
          <div><Label>{k === "snag" ? "Defect" : k === "rfi" ? "RFI title" : "Delay / stoppage"}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Details</Label><Textarea value={details} onChange={(e) => setDetails(e.target.value)} /></div>
          {k !== "notice" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Level / Zone</Label>
                <Select value={level} onValueChange={setLevel}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{levels.data?.map((l) => <SelectItem key={l.id} value={l.id}>{l.level_code}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Gridline</Label><Input placeholder="e.g. Grids C2-C3" value={grid} onChange={(e) => setGrid(e.target.value)} /></div>
            </div>
          )}
          {k === "snag" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Trade package</Label>
                <Select value={pkg} onValueChange={setPkg}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{pkgs.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.package_code} {p.package_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Critical / Life Safety", "Major Defect", "Minor Cosmetic"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
          )}
          <Button size="lg" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
