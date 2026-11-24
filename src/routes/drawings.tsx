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

export const Route = createFileRoute("/drawings")({
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
    const { error } = await db.from("drawing_pins").insert({ drawing_id: sel.id, pin_type: mode, x_percent: x, y_percent: y, note: `${pinLabel[mode]} logged on ${sel.sheet_number}` });
    if (error) { toast.error(error.message); return; }
    toast.success(`${pinLabel[mode]} pinned`);
    refresh("drawing_pins");
  }

  return (
    <>
      <PageTitle title="Drawing & Specification Register" sub="Construction issue sheets · click a plan to anchor an RFI, snag or safety observation" />
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
                  <PlanSheet seed={`${sel.sheet_number} ${sel.current_revision}`} showChanges={compare} />
                  {sheetPins.map((p) => (
                    <div key={p.id} title={`${pinLabel[p.pin_type]} ${p.reference_id ?? ""}: ${p.note ?? ""}`}
                      className="group absolute -translate-x-1/2 -translate-y-full" style={{ left: `${p.x_percent}%`, top: `${p.y_percent}%` }}>
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
      {create && sel && (
        <QuickCreate open onOpenChange={(o) => !o && setCreate(null)} initial={{ kind: create.kind, drawing_id: sel.id, x: create.x, y: create.y }} />
      )}
    </>
  );
}
