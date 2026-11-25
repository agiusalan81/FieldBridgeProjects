import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MousePointer2, MapPin, GitCompare, Camera, ImagePlus, FileText, Loader2 } from "lucide-react";
import { PlanViewer } from "@/components/fb/PlanViewer";
import { useBackClose } from "@/hooks/use-back-close";
import { findDuplicateSheet } from "@/lib/drawing";
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
import { PhotoPicker } from "@/components/fb/PhotoPicker";
import { PROJECT_ID } from "@/lib/db";
import { saveSiteRecord } from "@/lib/offline";
import { nextNumber } from "@/lib/workflow";
import { drawingPinStatus } from "@/lib/issue-register";
import { RegisterFilter } from "@/components/fb/RegisterFilter";

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
  const rfis = useTable("rfis");
  const snags = useTable("snags");
  const refresh = useRefresh();
  const [selId, setSelId] = useState<string>();
  const sel = drawings.data?.find((d) => d.id === selId) ?? drawings.data?.[0];
  const [mode, setMode] = useState<"pan" | "rfi" | "snag" | "observation" | "safety_hazard">("pan");
  const [compare, setCompare] = useState(false);
  const [hazard, setHazard] = useState<{ type: "observation" | "safety_hazard"; x: number; y: number } | null>(null);
  const [pinId, setPinId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStatus, setHistoryStatus] = useState("Resolved");
  const [historyType, setHistoryType] = useState("all");
  const [create, setCreate] = useState<{ kind: "rfi" | "snag"; x: number; y: number } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => {
    const g: Record<string, Row[]> = {};
    drawings.data?.forEach((d) => { const k = d.discipline.startsWith("MEP") ? "MEP Services" : d.discipline; (g[k] ??= []).push(d); });
    return g;
  }, [drawings.data]);
  const effectivePins = (pins.data ?? []).map((p) => ({ ...p, status: drawingPinStatus(p, rfis.data ?? [], snags.data ?? []) }));
  const allSheetPins = effectivePins.filter((p) => p.drawing_id === sel?.id);
  const sheetPins = allSheetPins.filter((p) => p.status !== "Resolved");
  const historyPins = allSheetPins.filter((p) => (historyStatus === "All" || p.status === historyStatus) && (historyType === "all" || p.pin_type === historyType));
  const revs = revisions.data?.filter((r) => r.drawing_id === sel?.id) ?? [];

  async function onClick(e: React.MouseEvent) {
    if (!sel || mode === "pan" || !sheetRef.current) return;
    const r = sheetRef.current.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1);
    if (mode === "rfi" || mode === "snag") return setCreate({ kind: mode, x, y });
    setHazard({ type: mode, x, y });
  }

  return (
    <>
      <PageTitle title="Drawing & Specification Register" sub="Construction issue sheets"><Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add drawing</Button></PageTitle>
      {drawings.error && <p role="alert" className="mb-3 text-sm text-destructive">{drawings.error.message}</p>}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          {Object.entries(grouped).map(([disc, list]) => (
            <div key={disc}>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{disc}</h3>
              {list.map((d) => (
                <button key={d.id} onClick={() => setSelId(d.id)}
                  className={`mb-1.5 w-full rounded-md border bg-card p-3 text-left ${sel?.id === d.id ? "border-primary ring-2 ring-primary" : ""}`}>
                  <div className="flex items-center justify-between"><span className="font-mono text-sm font-semibold">{d.sheet_number}</span><span className="font-mono text-xs">{d.current_revision}</span></div>
                  <div className="text-sm">{d.sheet_title}</div>
                  <div className="mt-1 flex items-center justify-between"><StatusBadge value={d.status} /><span className="text-[11px] text-muted-foreground">{effectivePins.filter((p) => p.drawing_id === d.id && p.status !== "Resolved").length} active pins</span></div>
                </button>
              ))}
            </div>
          ))}
        </aside>
        {sel && (
          <section className="min-w-0">
            {(() => {
              const modeButtons = (["pan", "rfi", "snag", "observation", "safety_hazard"] as const).map((m) => (
                <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
                  {m === "pan" ? <MousePointer2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}{m === "pan" ? "Move" : pinLabel[m]}
                </Button>
              ));
              return (<>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {modeButtons}
                  <span className="mx-1 h-6 w-px bg-border" />
                  <Button size="sm" variant={compare ? "default" : "outline"} onClick={() => setCompare((c) => !c)} disabled={revs.length < 2}>
                    <GitCompare className="h-4 w-4" />{revs.length >= 2 ? `Compare ${revs[1]?.revision_code} → ${revs[0]?.revision_code}` : "No prior rev"}
                  </Button>
                </div>
                <p className="mb-1 text-xs text-muted-foreground">Pinch or use two fingers to zoom and move · double-tap to zoom · tap a pin type, then tap the plan to drop it.</p>
                <PlanViewer resetKey={sel.id} panEnabled={mode === "pan"} toolbar={modeButtons} cursor={mode === "pan" ? "grab" : "crosshair"}>
                  <div ref={sheetRef} className="relative mx-auto aspect-[10/7] h-full max-w-full" onClick={onClick}>
                    {sel.drawing_url ? <img src={sel.drawing_url} alt={sel.sheet_title} className="h-full w-full bg-card object-contain" draggable={false} /> : <PlanSheet seed={`${sel.sheet_number} ${sel.current_revision}`} showChanges={compare} />}
                    {sheetPins.map((p) => (
                      <div key={p.id} title={`${pinLabel[p.pin_type]} ${p.reference_id ?? ""}: ${p.note ?? ""}`}
                        onClick={(e) => { e.stopPropagation(); setPinId(p.id); }}
                        className="group absolute -translate-x-1/2 -translate-y-full cursor-pointer" style={{ left: `${p.x_percent}%`, top: `${p.y_percent}%` }}>
                        <div className={`flex h-7 min-w-7 items-center justify-center rounded-full rounded-bl-none border-2 border-card px-1 text-[10px] font-bold text-success-foreground shadow ${pinColor[p.pin_type]}`}>
                          {p._offline ? "↥" : p.reference_id?.split("-")[1] ?? "!"}
                        </div>
                        <div className="pointer-events-none absolute left-8 top-0 z-10 hidden w-48 rounded bg-shell p-2 text-xs text-shell-foreground group-hover:block">
                          <b>{pinLabel[p.pin_type]} {p.reference_id}</b><br />{p.note}
                        </div>
                      </div>
                    ))}
                  </div>
                </PlanViewer>
              </>);
            })()}
            <section className="mt-4 border-t pt-3">
              <Button variant="outline" aria-expanded={historyOpen} className="mb-3" onClick={() => setHistoryOpen((o) => !o)}>Issue history · {allSheetPins.filter((p) => p.status === "Resolved").length} resolved</Button>
              {historyOpen && <>
                <div className="mb-3 flex flex-wrap gap-2">{["All", "Open", "Resolved"].map((s) => <Button key={s} variant={historyStatus === s ? "default" : "outline"} size="sm" onClick={() => setHistoryStatus(s)}>{s}</Button>)}</div>
                <div className="mb-3 max-w-sm"><RegisterFilter label="issue types" value={historyType} onChange={setHistoryType} items={Object.entries(pinLabel)} /></div>
                <div className="grid gap-2">{historyPins.map((p) => <Button key={p.id} variant="outline" className="h-auto min-w-0 flex-col items-stretch gap-1 whitespace-normal p-3 text-left" onClick={() => setPinId(p.id)}>
                  <span className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{pinLabel[p.pin_type]} {p.reference_id}</span><StatusBadge value={p.status} /></span>
                  <span className="break-words text-sm">{p.note}</span>
                  {p.resolved_at && <span className="text-xs text-muted-foreground">Resolved {new Date(p.resolved_at).toLocaleDateString()}</span>}
                </Button>)}</div>
                {!historyPins.length && <p className="py-3 text-sm text-muted-foreground">No issues match these filters.</p>}
              </>}
            </section>
            <div className="mt-3 overflow-x-auto rounded-md border bg-card p-3">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Revision history</h3>
              <table className="w-full text-sm"><tbody>
                {revs.map((r) => <tr key={r.id} className="border-t"><td className="py-1.5 font-mono font-semibold">{r.revision_code}</td><td>{r.date_issued}</td><td>{r.issued_by}</td><td className="text-muted-foreground">{r.reason_for_issue}</td></tr>)}
              </tbody></table>
            </div>
          </section>
        )}
      </div>
      {hazard && sel && <HazardDialog drawing={sel} spot={hazard} onClose={() => setHazard(null)} />}
      <PinInspector pin={effectivePins.find((p) => p.id === pinId)} onClose={() => setPinId(null)} />
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
  const [f, setF] = useState({ cat: HAZARD_CATS[0] ?? "Other", sev: isHaz ? "Urgent" : "Advisory", note: "", action: "" });
  const [photo, setPhoto] = useState<string>();
  const pins = useTable("drawing_pins");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!f.note.trim()) { toast.error("Describe what you saw"); return; }
    setSaving(true);
    try {
      const ref = nextNumber(isHaz ? "HAZ" : "OBS", (pins.data ?? []).filter((p) => p.drawing_id === drawing.id && p.pin_type === spot.type).map((p) => p.reference_id));
      const result = await saveSiteRecord(PROJECT_ID, [{ table: "drawing_pins", row: { drawing_id: drawing.id, pin_type: spot.type, x_percent: spot.x, y_percent: spot.y, reference_id: ref, note: f.note, hazard_category: isHaz ? f.cat : null, severity: f.sev, corrective_action: f.action || null, photo_url: photo ?? null, status: "Open" } }]);
      toast.success(result.queued ? "Pin and photo saved on this device · awaiting sync" : `${pinLabel[spot.type]} logged on ${drawing.sheet_number}`);
      refresh("drawing_pins"); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save. Your entries are still here."); }
    finally { setSaving(false); }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display uppercase">{isHaz ? "Log safety hazard" : "Log observation"} · {drawing.sheet_number}</DialogTitle></DialogHeader>
        {isHaz && <label className="text-sm">Hazard type<select className="mt-1 h-9 w-full rounded-md border bg-background px-2" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{HAZARD_CATS.map((c) => <option key={c}>{c}</option>)}</select></label>}
        <div className="grid grid-cols-3 gap-1">{SEVERITIES.map((s) => <Button key={s} type="button" variant={f.sev === s ? (s === "Stop Work" ? "destructive" : "default") : "outline"} onClick={() => setF({ ...f, sev: s })}>{s}</Button>)}</div>
        <Textarea placeholder="What is the hazard / observation?" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <Textarea placeholder="Immediate corrective action required" value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} />
        <div className="text-sm">Photo (optional)<PhotoPicker value={photo} onChange={setPhoto} /></div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save pin"}</Button>
      </DialogContent>
    </Dialog>
  );
}

function PinInspector({ pin, onClose }: { pin?: Row; onClose: () => void }) {
  const refresh = useRefresh();
  useBackClose(!!pin, onClose);
  return (
    <Sheet open={!!pin} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-md" style={{ touchAction: "pan-y" }}>
        {pin && (<>
          <SheetHeader><SheetTitle className="font-display text-2xl uppercase">{pinLabel[pin.pin_type]} {pin.reference_id ?? ""}</SheetTitle></SheetHeader>
          <div className="space-y-3 px-4 pb-6 text-sm">
            <div className="flex flex-wrap gap-2"><StatusBadge value={pin.status} />{pin._offline && <span className="text-xs text-muted-foreground">{pin._offline}</span>}{pin.severity && <StatusBadge value={pin.severity} />}{pin.hazard_category && <StatusBadge value={pin.hazard_category} />}</div>
            <p>{pin.note}</p>
            {pin.corrective_action && <p><b>Corrective action:</b> {pin.corrective_action}</p>}
            {pin.photo_url && <img src={pin.photo_url} alt="As found" className="rounded" />}
            <p className="text-xs text-muted-foreground">Logged {new Date(pin.created_at).toLocaleString()}</p>
            {!pin._offline && (pin.status === "Resolved" ? (
              <div className="rounded-md border-2 border-success p-3"><b>Resolved</b> {pin.resolved_at && new Date(pin.resolved_at).toLocaleDateString()}<p>{pin.resolution_note}</p>{pin.resolved_photo_url && <img src={pin.resolved_photo_url} alt="Resolution evidence" className="mt-2 rounded" />}</div>
            ) : ["rfi", "snag"].includes(pin.pin_type) ? <p className="text-muted-foreground">Manage this item from its {pin.pin_type === "rfi" ? "RFI" : "Snagging"} register.</p> : (
              <ResolveWithPhoto onResolve={async (photo, note) => {
                const { error } = await db.from("drawing_pins").update({ status: "Resolved", resolved_photo_url: photo, resolution_note: note, resolved_at: new Date().toISOString() }).eq("id", pin.id);
                if (error) { toast.error(error.message); return; }
                toast.success("Marked resolved"); refresh("drawing_pins");
              }} />
            ))}
            {!pin._offline && <DeleteMistake table="drawing_pins" row={pin} label={`pin ${pin.reference_id ?? ""}`} onDone={onClose} />}
            {["rfi", "snag"].includes(pin.pin_type) && <Button variant="outline" className="h-11 w-full" asChild><Link to={pin.pin_type === "rfi" ? "/rfis" : "/snags"}>Open {pin.pin_type === "rfi" ? "RFI" : "Snagging"} register</Link></Button>}
            <Button variant="outline" className="h-11 w-full" onClick={onClose}>Back to drawing</Button>
            <div className="h-24" aria-hidden />
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
  const drawings = useTable("drawings", { order: "sheet_number" });
  const draftKey = `fb-drawing-draft:${PROJECT_ID}`;
  const blank = { discipline: DISCIPLINES[0] ?? "Architectural", sheet_number: "", sheet_title: "", level_code: "", rev: "P01", reason: "First issue" };
  const [f, setF] = useState(blank);
  const [file, setFile] = useState<string>();
  const [pdf, setPdf] = useState<{ file: File; pages: number; page: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [dup, setDup] = useState<Row | null>(null);
  const camRef = useRef<HTMLInputElement>(null), galRef = useRef<HTMLInputElement>(null), pdfRef = useRef<HTMLInputElement>(null);
  useBackClose(open, () => onOpenChange(false));
  useEffect(() => {
    if (!open) return;
    try { const d = localStorage.getItem(draftKey); if (d) setF({ ...blank, ...JSON.parse(d) }); } catch { /* ignore bad draft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  function update(next: typeof f) { setF(next); setDup(null); try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* storage full */ } }
  async function renderPage(fl: File, page: number, pages: number) {
    setBusy(true);
    try { const { pdfPageToDataUrl } = await import("@/lib/pdf"); setFile(await pdfPageToDataUrl(fl, page)); setPdf({ file: fl, pages, page }); }
    catch { toast.error("Could not read that PDF"); } finally { setBusy(false); }
  }
  async function pick(fl: File | undefined, input: HTMLInputElement) {
    input.value = "";
    if (!fl) return;
    if (fl.type === "application/pdf" || fl.name.toLowerCase().endsWith(".pdf")) {
      const { pdfPageCount } = await import("@/lib/pdf");
      try { await renderPage(fl, 1, await pdfPageCount(fl)); } catch { toast.error("Could not read that PDF"); }
    } else {
      setBusy(true);
      try { setPdf(null); setFile(await photoToDataUrl(fl, 2400)); } catch { toast.error("Could not read that photo"); } finally { setBusy(false); }
    }
  }
  function done(id: string, msg: string) {
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    toast.success(msg); refresh("drawings", "drawing_revisions"); onCreated(id); setF(blank); setFile(undefined); setPdf(null); setDup(null); onOpenChange(false);
  }
  async function run(task: () => Promise<void>) {
    if (savingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) { toast.error("No signal — drawings need a connection to upload. Your details are kept."); return; }
    savingRef.current = true; setSaving(true);
    try { await task(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save. Your details are kept."); }
    finally { savingRef.current = false; setSaving(false); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const existing = findDuplicateSheet(drawings.data, f.sheet_number);
    if (existing) { setDup(existing); return; }
    await run(async () => {
      const { data, error } = await db.from("drawings").insert({ project_id: PROJECT_ID, discipline: f.discipline, sheet_number: f.sheet_number.trim(), sheet_title: f.sheet_title, level_code: f.level_code || null, current_revision: f.rev, status: "For Construction", drawing_url: file ?? null }).select("id").single();
      if (error) throw error;
      await db.from("drawing_revisions").insert({ drawing_id: data.id, revision_code: f.rev, date_issued: new Date().toISOString().slice(0, 10), reason_for_issue: f.reason, revision_file_url: file ?? null });
      done(data.id, `${f.sheet_number} added`);
    });
  }
  async function addRevision(existing: Row) {
    if (f.rev.trim().toLowerCase() === String(existing.current_revision).trim().toLowerCase()) { toast.error(`${existing.sheet_number} is already at ${existing.current_revision}. Enter the new revision code.`); return; }
    await run(async () => {
      const patch: Record<string, unknown> = { current_revision: f.rev, sheet_title: f.sheet_title || existing.sheet_title, level_code: f.level_code || existing.level_code };
      if (file) patch["drawing_url"] = file;
      const { error } = await db.from("drawings").update(patch).eq("id", existing.id);
      if (error) throw error;
      await db.from("drawing_revisions").insert({ drawing_id: existing.id, revision_code: f.rev, date_issued: new Date().toISOString().slice(0, 10), reason_for_issue: f.reason, revision_file_url: file ?? null });
      done(existing.id, `${existing.sheet_number} updated to ${f.rev}`);
    });
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overscroll-contain">
        <DialogHeader><DialogTitle className="font-display uppercase">Add drawing</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-2">
          <select aria-label="Discipline" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.discipline} onChange={(e) => update({ ...f, discipline: e.target.value })}>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}</select>
          <Input required placeholder="Sheet number e.g. A-104" value={f.sheet_number} onChange={(e) => update({ ...f, sheet_number: e.target.value })} />
          <Input required placeholder="Sheet title" value={f.sheet_title} onChange={(e) => update({ ...f, sheet_title: e.target.value })} />
          <select aria-label="Level" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.level_code} onChange={(e) => update({ ...f, level_code: e.target.value })}><option value="">No specific level</option>{levels.data?.map((l) => <option key={l.id} value={l.level_code}>{l.level_code}</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><Input required placeholder="Revision" value={f.rev} onChange={(e) => update({ ...f, rev: e.target.value })} /><Input placeholder="Reason for issue" value={f.reason} onChange={(e) => update({ ...f, reason: e.target.value })} /></div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0], e.target)} />
          <input ref={galRef} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0], e.target)} />
          <input ref={pdfRef} type="file" accept="application/pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0], e.target)} />
          <div className="text-sm">Drawing file</div>
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" className="h-11 px-1" disabled={busy || saving} onClick={() => camRef.current?.click()}><Camera className="h-4 w-4" />Take photo</Button>
            <Button type="button" variant="outline" className="h-11 px-1" disabled={busy || saving} onClick={() => galRef.current?.click()}><ImagePlus className="h-4 w-4" />Gallery</Button>
            <Button type="button" variant="outline" className="h-11 px-1" disabled={busy || saving} onClick={() => pdfRef.current?.click()}><FileText className="h-4 w-4" />PDF</Button>
          </div>
          {pdf && pdf.pages > 1 && <label className="block text-sm">PDF page ({pdf.pages} in set)<select className="h-9 w-full rounded-md border bg-background px-2" value={pdf.page} onChange={(e) => renderPage(pdf.file, Number(e.target.value), pdf.pages)}>{Array.from({ length: pdf.pages }, (_, i) => <option key={i} value={i + 1}>Page {i + 1}</option>)}</select></label>}
          {busy && <p className="text-xs text-muted-foreground">Reading file…</p>}
          {file && <img src={file} alt="Preview" className="max-h-32 rounded border" />}
          {dup ? (
            <div role="alert" className="space-y-2 rounded-md border-2 border-primary p-3 text-sm">
              <p><b>{dup.sheet_number}</b> is already in the register (currently {dup.current_revision}). Do you want to issue this as a new revision of that sheet?</p>
              <Button type="button" className="w-full" disabled={saving || busy} onClick={() => addRevision(dup)}>{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : `Issue as revision ${f.rev}`}</Button>
              <Button type="button" variant="outline" className="w-full" disabled={saving} onClick={() => setDup(null)}>Change sheet number</Button>
            </div>
          ) : (
            <Button type="submit" className="w-full" disabled={busy || saving}>{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Adding drawing to register…</> : "Add to register"}</Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
