import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize, MousePointer2, MapPin, GitCompare } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { PlanSheet } from "@/components/fb/PlanSheet";
import { QuickCreate } from "@/components/fb/QuickCreate";
import { Button } from "@/components/ui/button";
import { db, useTable, useRefresh, type Row } from "@/lib/db";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeleteMistake, ResolveWithPhoto } from "@/components/fb/Workflow";
import { photoToDataUrl } from "@/lib/photo";
import { PROJECT_ID } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/drawings")({
  head: () => pageHead("Drawing Register", "Construction issue drawings by discipline with pan/zoom viewer, pin drops and revision comparison."),
  component: Drawings,
});

const pinColor: Record<string, string> = { rfi: "bg-info", snag: "bg-primary", observation: "bg-success", safety_hazard: "bg-destructive" };
const pinLabel: Record<string, string> = { rfi: "RFI", snag: "Snag", observation: "Observation", safety_hazard: "Safety hazard" };

function Drawings() {
  const drawings = useTable("drawings", { order: "sheet_number" });
  const revisions = useTable("drawing_revisions", { order: "date_issued", asc: false });
  const pins = useTable("drawing_pins");
  const refresh = useRefresh();
  const [selId, setSelId] = useState<string>();
  const sel = drawings.data?.find((d) => d.id === selId) ?? drawings.data?.[0];
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<"pan" | "rfi" | "snag" | "observation" | "safety_hazard">("pan");
  const [compare, setCompare] = useState(false);
  const [hazard, setHazard] = useState<{ type: "observation" | "safety_hazard"; x: number; y: number } | null>(null);
  const [pinId, setPinId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [create, setCreate] = useState<{ kind: "rfi" | "snag"; x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => {
    const g: Record<string, Row[]> = {};
    drawings.data?.forEach((d) => { const k = d.discipline.startsWith("MEP") ? "MEP Services" : d.discipline; (g[k] ??= []).push(d); });
    return g;
  }, [drawings.data]);
  const sheetPins = pins.data?.filter((p) => p.drawing_id === sel?.id) ?? [];
  const revs = revisions.data?.filter((r) => r.drawing_id === sel?.id) ?? [];

  async function onClick(e: React.MouseEvent) {
    if (!sel || mode === "pan" || drag.current?.moved) return;
    const r = sheetRef.current!.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1);
    if (mode === "rfi" || mode === "snag") return setCreate({ kind: mode, x, y });
    setHazard({ type: mode, x, y });
  }

  return (
    <>
      <PageTitle title="Drawing & Specification Register" sub="Construction issue sheets · click a plan to anchor an RFI, snag or safety observation"><Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add drawing</Button></PageTitle>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          {Object.entries(grouped).map(([disc, list]) => (
            <div key={disc}>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{disc}</h3>
              {list.map((d) => (
                <button key={d.id} onClick={() => { setSelId(d.id); setZoom(1); setPan({ x: 0, y: 0 }); }}
                  className={`mb-1.5 w-full rounded-md border bg-card p-3 text-left ${sel?.id === d.id ? "border-primary ring-2 ring-primary" : ""}`}>
                  <div className="flex items-center justify-between"><span className="font-mono text-sm font-semibold">{d.sheet_number}</span><span className="font-mono text-xs">{d.current_revision}</span></div>
                  <div className="text-sm">{d.sheet_title}</div>
                  <div className="mt-1 flex items-center justify-between"><StatusBadge value={d.status} /><span className="text-[11px] text-muted-foreground">{pins.data?.filter((p) => p.drawing_id === d.id).length ?? 0} pins</span></div>
                </button>
              ))}
            </div>
          ))}
        </aside>
        {sel && (
          <section className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {(["pan", "rfi", "snag", "observation", "safety_hazard"] as const).map((m) => (
                <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
                  {m === "pan" ? <MousePointer2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}{m === "pan" ? "Pan" : pinLabel[m]}
                </Button>
              ))}
              <span className="mx-1 h-6 w-px bg-border" />
              <Button size="icon" variant="outline" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}><ZoomIn className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}><ZoomOut className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" aria-label="Reset view" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize className="h-4 w-4" /></Button>
              <Button size="sm" variant={compare ? "default" : "outline"} onClick={() => setCompare((c) => !c)} disabled={revs.length < 2}>
                <GitCompare className="h-4 w-4" />{revs.length >= 2 ? `Compare ${revs[1]!.revision_code} → ${revs[0]!.revision_code}` : "No prior rev"}
              </Button>
            </div>
            <div className="relative h-[60vh] overflow-hidden rounded-md border-2 border-shell bg-muted touch-none"
              onWheel={(e) => setZoom((z) => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001)))}
              onPointerDown={(e) => { drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y, moved: false }; }}
              onPointerMove={(e) => { if (drag.current && mode === "pan" && e.buttons) { drag.current.moved = true; setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); } }}
              onPointerUp={() => setTimeout(() => (drag.current = null), 0)}
              style={{ cursor: mode === "pan" ? "grab" : "crosshair" }}>
              <div className="absolute inset-0 origin-center" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                <div ref={sheetRef} className="relative mx-auto aspect-[10/7] h-full max-w-full" onClick={onClick}>
                  {sel.drawing_url ? <img src={sel.drawing_url} alt={sel.sheet_title} className="h-full w-full bg-card object-contain" draggable={false} /> : <PlanSheet seed={`${sel.sheet_number} ${sel.current_revision}`} showChanges={compare} />}
                  {sheetPins.map((p) => (
                    <div key={p.id} title={`${pinLabel[p.pin_type]} ${p.reference_id ?? ""}: ${p.note ?? ""}`}
                      onClick={(e) => { e.stopPropagation(); setPinId(p.id); }}
                      className={`group absolute -translate-x-1/2 -translate-y-full cursor-pointer ${p.status === "Resolved" ? "opacity-50" : ""}`} style={{ left: `${p.x_percent}%`, top: `${p.y_percent}%` }}>
                      <div className={`flex h-7 min-w-7 items-center justify-center rounded-full rounded-bl-none border-2 border-card px-1 text-[10px] font-bold text-success-foreground shadow ${pinColor[p.pin_type]}`}>
                        {p.reference_id?.split("-")[1] ?? "!"}
                      </div>
                      <div className="pointer-events-none absolute left-8 top-0 z-10 hidden w-48 rounded bg-shell p-2 text-xs text-shell-foreground group-hover:block">
                        <b>{pinLabel[p.pin_type]} {p.reference_id}</b><br />{p.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-2 left-2 rounded bg-shell px-2 py-1 font-mono text-xs text-shell-foreground">{Math.round(zoom * 100)}%</div>
            </div>
            <div className="mt-3 rounded-md border bg-card p-3">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Revision history</h3>
              <table className="w-full text-sm"><tbody>
                {revs.map((r) => <tr key={r.id} className="border-t"><td className="py-1.5 font-mono font-semibold">{r.revision_code}</td><td>{r.date_issued}</td><td>{r.issued_by}</td><td className="text-muted-foreground">{r.reason_for_issue}</td></tr>)}
              </tbody></table>
            </div>
          </section>
        )}
      </div>
      {hazard && sel && <HazardDialog drawing={sel} spot={hazard} onClose={() => setHazard(null)} />}
      <PinInspector pin={pins.data?.find((p) => p.id === pinId)} onClose={() => setPinId(null)} />
      <AddDrawing open={addOpen} onOpenChange={setAddOpen} onCreated={(id) => setSelId(id)} />
      {create && sel && (
        <QuickCreate open onOpenChange={(o) => !o && setCreate(null)} initial={{ kind: create.kind, drawing_id: sel.id, x: create.x, y: create.y }} />
      )}
    </>
  );
}

const HAZARD_CATS = ["Unprotected edge", "Scaffolding", "Electrical", "Tripping / housekeeping", "PPE breach", "Lifting operations", "Excavation", "Fire risk", "Other"];
const SEVERITIES = ["Stop Work", "Urgent", "Advisory"];

function HazardDialog({ drawing, spot, onClose }: { drawing: Row; spot: { type: "observation" | "safety_hazard"; x: number; y: number }; onClose: () => void }) {
  const refresh = useRefresh();
  const isHaz = spot.type === "safety_hazard";
  const [f, setF] = useState({ cat: HAZARD_CATS[0]!, sev: isHaz ? "Urgent" : "Advisory", note: "", action: "" });
  const [photo, setPhoto] = useState<string>();
  async function save() {
    if (!f.note.trim()) { toast.error("Describe what you saw"); return; }
    const { data: ex } = await db.from("drawing_pins").select("reference_id").eq("pin_type", spot.type);
    const prefix = isHaz ? "HAZ" : "OBS";
    const n = Math.max(0, ...(ex ?? []).map((r: Row) => parseInt(String(r.reference_id ?? "").split("-")[1] ?? "0", 10) || 0)) + 1;
    const { error } = await db.from("drawing_pins").insert({ drawing_id: drawing.id, pin_type: spot.type, x_percent: spot.x, y_percent: spot.y, reference_id: `${prefix}-${String(n).padStart(3, "0")}`,
      note: f.note, hazard_category: isHaz ? f.cat : null, severity: f.sev, corrective_action: f.action || null, photo_url: photo ?? null, status: "Open" });
    if (error) { toast.error(error.message); return; }
    toast.success(`${pinLabel[spot.type]} logged on ${drawing.sheet_number}`); refresh("drawing_pins"); onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display uppercase">{isHaz ? "Log safety hazard" : "Log observation"} · {drawing.sheet_number}</DialogTitle></DialogHeader>
        {isHaz && <label className="text-sm">Hazard type<select className="mt-1 h-9 w-full rounded-md border bg-background px-2" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{HAZARD_CATS.map((c) => <option key={c}>{c}</option>)}</select></label>}
        <div className="grid grid-cols-3 gap-1">{SEVERITIES.map((s) => <Button key={s} type="button" variant={f.sev === s ? (s === "Stop Work" ? "destructive" : "default") : "outline"} onClick={() => setF({ ...f, sev: s })}>{s}</Button>)}</div>
        <Textarea placeholder="What is the hazard / observation?" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <Textarea placeholder="Immediate corrective action required" value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} />
        <label className="text-sm">Photo (optional)<Input type="file" accept="image/*" capture="environment" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setPhoto(await photoToDataUrl(file)); }} /></label>
        {photo && <img src={photo} alt="Hazard" className="max-h-32 rounded" />}
        <Button onClick={save}>Save pin</Button>
      </DialogContent>
    </Dialog>
  );
}

function PinInspector({ pin, onClose }: { pin?: Row; onClose: () => void }) {
  const refresh = useRefresh();
  return (
    <Sheet open={!!pin} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {pin && (<>
          <SheetHeader><SheetTitle className="font-display text-2xl uppercase">{pinLabel[pin.pin_type]} {pin.reference_id ?? ""}</SheetTitle></SheetHeader>
          <div className="space-y-3 px-4 pb-6 text-sm">
            <div className="flex flex-wrap gap-2"><StatusBadge value={pin.status} />{pin.severity && <StatusBadge value={pin.severity} />}{pin.hazard_category && <StatusBadge value={pin.hazard_category} />}</div>
            <p>{pin.note}</p>
            {pin.corrective_action && <p><b>Corrective action:</b> {pin.corrective_action}</p>}
            {pin.photo_url && <img src={pin.photo_url} alt="As found" className="rounded" />}
            <p className="text-xs text-muted-foreground">Logged {new Date(pin.created_at).toLocaleString()}</p>
            {pin.status === "Resolved" ? (
              <div className="rounded-md border-2 border-success p-3"><b>Resolved</b> {pin.resolved_at && new Date(pin.resolved_at).toLocaleDateString()}<p>{pin.resolution_note}</p>{pin.resolved_photo_url && <img src={pin.resolved_photo_url} alt="Resolution evidence" className="mt-2 rounded" />}</div>
            ) : ["rfi", "snag"].includes(pin.pin_type) ? <p className="text-muted-foreground">Manage this item from its {pin.pin_type === "rfi" ? "RFI" : "Snagging"} register.</p> : (
              <ResolveWithPhoto onResolve={async (photo, note) => {
                const { error } = await db.from("drawing_pins").update({ status: "Resolved", resolved_photo_url: photo, resolution_note: note, resolved_at: new Date().toISOString() }).eq("id", pin.id);
                if (error) { toast.error(error.message); return; }
                toast.success("Marked resolved"); refresh("drawing_pins");
              }} />
            )}
            <DeleteMistake table="drawing_pins" row={pin} label={`pin ${pin.reference_id ?? ""}`} onDone={onClose} />
          </div>
        </>)}
      </SheetContent>
    </Sheet>
  );
}

const DISCIPLINES = ["Architectural", "Structural", "MEP - Mechanical", "MEP - Electrical", "Civils", "Landscape"];

function AddDrawing({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const refresh = useRefresh();
  const levels = useTable("project_levels_zones", { order: "sequence_order" });
  const [f, setF] = useState({ discipline: DISCIPLINES[0]!, sheet_number: "", sheet_title: "", level_code: "", rev: "P01", reason: "First issue" });
  const [file, setFile] = useState<string>();
  const [pdf, setPdf] = useState<{ file: File; pages: number; page: number } | null>(null);
  const [busy, setBusy] = useState(false);
  async function renderPage(fl: File, page: number, pages: number) {
    setBusy(true);
    try { const { pdfPageToDataUrl } = await import("@/lib/pdf"); setFile(await pdfPageToDataUrl(fl, page)); setPdf({ file: fl, pages, page }); }
    catch { toast.error("Could not read that PDF"); } finally { setBusy(false); }
  }
  async function pick(fl?: File) {
    if (!fl) return;
    if (fl.type === "application/pdf" || fl.name.toLowerCase().endsWith(".pdf")) {
      const { pdfPageCount } = await import("@/lib/pdf");
      try { await renderPage(fl, 1, await pdfPageCount(fl)); } catch { toast.error("Could not read that PDF"); }
    } else { setPdf(null); setFile(await photoToDataUrl(fl, 2400)); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await db.from("drawings").insert({ project_id: PROJECT_ID, discipline: f.discipline, sheet_number: f.sheet_number, sheet_title: f.sheet_title, level_code: f.level_code || null, current_revision: f.rev, status: "For Construction", drawing_url: file ?? null }).select("id").single();
    if (error) { toast.error(error.message); return; }
    await db.from("drawing_revisions").insert({ drawing_id: data.id, revision_code: f.rev, date_issued: new Date().toISOString().slice(0, 10), reason_for_issue: f.reason, revision_file_url: file ?? null });
    toast.success(`${f.sheet_number} added`); refresh("drawings", "drawing_revisions"); onCreated(data.id); onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display uppercase">Add drawing</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-2">
          <select aria-label="Discipline" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.discipline} onChange={(e) => setF({ ...f, discipline: e.target.value })}>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}</select>
          <Input required placeholder="Sheet number e.g. A-104" value={f.sheet_number} onChange={(e) => setF({ ...f, sheet_number: e.target.value })} />
          <Input required placeholder="Sheet title" value={f.sheet_title} onChange={(e) => setF({ ...f, sheet_title: e.target.value })} />
          <select aria-label="Level" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.level_code} onChange={(e) => setF({ ...f, level_code: e.target.value })}><option value="">No specific level</option>{levels.data?.map((l) => <option key={l.id} value={l.level_code}>{l.level_code}</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><Input required placeholder="Revision" value={f.rev} onChange={(e) => setF({ ...f, rev: e.target.value })} /><Input placeholder="Reason for issue" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
          <label className="block text-sm">Drawing file (PDF, PNG or JPG)<Input type="file" accept="application/pdf,image/*" onChange={(e) => pick(e.target.files?.[0])} /></label>
          {pdf && pdf.pages > 1 && <label className="block text-sm">PDF page ({pdf.pages} in set)<select className="h-9 w-full rounded-md border bg-background px-2" value={pdf.page} onChange={(e) => renderPage(pdf.file, Number(e.target.value), pdf.pages)}>{Array.from({ length: pdf.pages }, (_, i) => <option key={i} value={i + 1}>Page {i + 1}</option>)}</select></label>}
          {busy && <p className="text-xs text-muted-foreground">Rendering PDF sheet…</p>}
          {file && <img src={file} alt="Preview" className="max-h-32 rounded border" />}
          <Button type="submit" className="w-full" disabled={busy}>Add to register</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

