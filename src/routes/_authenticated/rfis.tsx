import { createFileRoute } from "@tanstack/react-router";
import { ItemChat } from "@/components/fb/Collab";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, CalendarClock, Clock, Plus } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { db, useTable, useRefresh, byId, isOverdue } from "@/lib/db";
import { pageHead } from "@/lib/head";
import { DeleteMistake, ToVariation } from "@/components/fb/Workflow";
import { QuickCreate } from "@/components/fb/QuickCreate";
import { RegisterFilter } from "@/components/fb/RegisterFilter";
import { matchesRegister } from "@/lib/issue-register";

export const Route = createFileRoute("/_authenticated/rfis")({
  head: () => pageHead("RFI Register", "Requests for Information with level and gridline stamps, programme impact and consultant responses."),
  component: Rfis,
});

const FILTERS = ["All", "Draft", "Open", "Overdue", "Under Review", "Answered", "Closed"];

function Rfis() {
  const rfis = useTable("rfis", { order: "rfi_number", asc: false });
  const levels = useTable("project_levels_zones");
  const lv = byId(levels.data);
  const dw = byId(useTable("drawings").data);
  const refresh = useRefresh();
  const [filter, setFilter] = useState("All");
  const [selId, setSelId] = useState<string | null>(null);
  const [resp, setResp] = useState("");
  const [creating, setCreating] = useState(false);
  const [level, setLevel] = useState("all");
  const [consultant, setConsultant] = useState("all");
  const [discipline, setDiscipline] = useState("all");
  const pins = useTable("drawing_pins");
  const sel = rfis.data?.find((r) => r.id === selId);
  const status = (r: { status: string }) => (isOverdue(r) ? "Overdue" : r.status);
  const filtered = (rfis.data ?? []).filter((r) => matchesRegister(r, { status: "All", level, party: consultant, discipline }));
  const list = filtered.filter((r) => filter === "All" || status(r) === filter);
  const consultants = [...new Set<string>((rfis.data ?? []).map((r) => String(r.assigned_consultant ?? "")).filter(Boolean))].sort();
  const disciplines = [...new Set<string>((rfis.data ?? []).map((r) => String(r.discipline ?? "")).filter(Boolean))].sort();
  const location = (r: { drawing_id?: string; rfi_number: string; gridline_ref?: string }) => pins.data?.some((p) => p.drawing_id === r.drawing_id && p.reference_id === r.rfi_number && p.pin_type === "rfi") ? "Drawing pin" : r.gridline_ref || "—";
  const select = (r: { id: string; official_response?: string }) => { setSelId(r.id); setResp(r.official_response ?? ""); };

  async function patch(p: Record<string, unknown>, msg: string) {
    const { error } = await db.from("rfis").update(p).eq("id", selId);
    if (error) { toast.error(error.message); return; }
    toast.success(msg); refresh("rfis", "drawing_pins");
  }

  return (
    <>
      <PageTitle title="RFIs & Technical Queries" sub={`${rfis.data?.length ?? 0} RFIs · ${(rfis.data ?? []).filter(isOverdue).length} overdue`}><Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New RFI</Button></PageTitle>
      <QuickCreate open={creating} onOpenChange={setCreating} initial={{ kind: "rfi" }} />
      {rfis.error && <p role="alert" className="mb-3 text-sm text-destructive">{rfis.error.message}</p>}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f} · {filtered.filter((r) => f === "All" || status(r) === f).length}</Button>)}
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <RegisterFilter label="levels" value={level} onChange={setLevel} items={(levels.data ?? []).map((l) => [l.id, l.level_code])} />
        <RegisterFilter label="consultants" value={consultant} onChange={setConsultant} items={consultants.map((c) => [c, c])} />
        <RegisterFilter label="disciplines" value={discipline} onChange={setDiscipline} items={disciplines.map((d) => [d, d])} />
      </div>
      {!rfis.isPending && !list.length && <p className="py-6 text-sm text-muted-foreground">No RFIs match these filters.</p>}
      <div className="grid gap-3 md:hidden">
        {list.map((r) => <Button key={r.id} variant="outline" className="h-auto w-full min-w-0 flex-col items-stretch gap-2 whitespace-normal p-3 text-left" onClick={() => select(r)}>
          <span className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono font-bold">{r.rfi_number}</span><StatusBadge value={status(r)} /></span>
          <span className="break-words font-semibold">{r.title}</span>
          <span className="text-xs text-muted-foreground">{lv[r.level_zone_id]?.level_code ?? "No level"} · {location(r)}</span>
          <span className="break-words text-xs text-muted-foreground">{r.assigned_consultant ?? "Unassigned"} · {r.discipline}</span>
          <span className={`text-xs ${isOverdue(r) ? "text-destructive" : "text-muted-foreground"}`}>Required {r.date_required ?? "—"}</span>
          {r._offline && <span className="text-xs text-muted-foreground">{r._offline}</span>}
        </Button>)}
      </div>
      <div className="hidden overflow-x-auto rounded-md border bg-card md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-shell text-left text-xs uppercase tracking-wide text-shell-foreground">
            <tr><th className="p-3">RFI</th><th>Title</th><th>Location</th><th>Discipline</th><th>Impact</th><th>Required</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} onClick={() => select(r)} className="cursor-pointer border-t hover:bg-muted">
                <td className="p-3 font-mono font-bold">{r.rfi_number}</td>
                <td className="max-w-xs font-medium">{r.title}</td>
                <td className="text-xs">{lv[r.level_zone_id]?.level_code.split(" - ")[0]} · {pins.data?.some((p) => p.drawing_id === r.drawing_id && p.reference_id === r.rfi_number && p.pin_type === "rfi") ? "Drawing pin" : r.gridline_ref || "—"}</td>
                <td className="text-xs">{r.discipline}</td>
                <td className="text-xs">{r.programme_impact_days ? `${r.programme_impact_days}d` : "—"} · {r.cost_impact}</td>
                <td className={`font-mono text-xs ${isOverdue(r) ? "font-bold text-destructive" : ""}`}>{r.date_required}</td>
                <td><StatusBadge value={status(r)} />{r._offline && <span className="block text-xs text-muted-foreground">{r._offline}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto overscroll-contain touch-pan-y sm:max-w-lg">
          {sel && (<>
            <SheetHeader><SheetTitle className="font-display text-2xl uppercase">{sel.rfi_number}</SheetTitle></SheetHeader>
            <div className="space-y-4 px-4 pb-6">
              <div className="flex flex-wrap gap-2"><StatusBadge value={status(sel)} /><StatusBadge value={sel.cost_impact} /></div>
              <h3 className="text-lg font-semibold">{sel.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded border p-2"><MapPin className="mb-1 h-4 w-4 text-primary" />{lv[sel.level_zone_id]?.level_code}<br /><b>{pins.data?.some((p) => p.drawing_id === sel.drawing_id && p.reference_id === sel.rfi_number && p.pin_type === "rfi") ? "Drawing pin" : sel.gridline_ref || "—"}</b></div>
                <div className="rounded border p-2"><Clock className="mb-1 h-4 w-4 text-primary" />Programme impact<br /><b>{sel.programme_impact_days} days</b></div>
                <div className="rounded border p-2"><CalendarClock className="mb-1 h-4 w-4 text-primary" />Raised {sel.date_raised}<br />Required <b>{sel.date_required}</b></div>
                <div className="rounded border p-2">Drawing<br /><b className="font-mono">{dw[sel.drawing_id]?.sheet_number ?? "—"}</b></div>
              </div>
              <div><div className="text-xs font-bold uppercase text-muted-foreground">Query</div><p className="text-sm">{sel.query_details}</p></div>
               {(pins.data ?? []).filter((p) => p.pin_type === "rfi" && p.drawing_id === sel.drawing_id && p.reference_id === sel.rfi_number).map((p) => <div key={p.id} className="space-y-2">{p.photo_url && <img src={p.photo_url} alt="RFI evidence" className="w-full rounded" />}{p.resolution_note && <p className="text-sm">{p.resolution_note}</p>}{p.resolved_photo_url && <img src={p.resolved_photo_url} alt="RFI resolution evidence" className="w-full rounded" />}</div>)}
              {sel._offline && <p className="text-sm text-muted-foreground">{sel._offline}</p>}
              {!sel._offline && <div className="flex flex-wrap gap-2">
                <ItemChat itemType="rfi" itemId={sel.id} label={sel.rfi_number} />
                <DeleteMistake table="rfis" row={sel} label={sel.rfi_number} onDone={() => setSelId(null)} />
                {sel.cost_impact && sel.cost_impact !== "None" && <ToVariation source="rfi" sourceId={sel.id} linkTable="rfis" title={`${sel.rfi_number}: ${sel.title}`} scope={sel.official_response ?? sel.query_details} eot={sel.programme_impact_days ?? undefined} disabled={!!sel.variation_id} />}
              </div>}
              <div className="text-sm">Assigned: <b>{sel.assigned_consultant ?? "Unassigned"}</b></div>
              {!sel._offline && <div className="rounded-md border-2 border-shell p-3">
                <div className="mb-2 text-xs font-bold uppercase">Engineer / Architect formal response</div>
                {sel.official_response && <p className="mb-2 text-sm">{sel.official_response}<br /><span className="text-xs text-muted-foreground">Signed off {sel.response_date}</span></p>}
                {!["Answered", "Closed"].includes(sel.status) && (<>
                  <Textarea value={resp} onChange={(e) => setResp(e.target.value)} placeholder="Enter formal response…" />
                  <Button className="mt-2 w-full" onClick={() => resp.trim() && patch({ official_response: resp, status: "Answered", response_date: new Date().toISOString().slice(0, 10) }, "Response issued")}>Issue response & sign off</Button>
                </>)}
                {sel.status === "Answered" && <Button variant="outline" className="w-full" onClick={() => patch({ status: "Closed" }, "RFI closed")}>Close RFI</Button>}
                {sel.status === "Draft" && <Button variant="outline" className="mt-2 w-full" onClick={() => patch({ status: "Open" }, "RFI issued")}>Issue RFI</Button>}
              </div>}
              <Button variant="outline" className="h-11 w-full" onClick={() => setSelId(null)}>Back to RFI register</Button>
              <div className="h-16" aria-hidden />
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </>
  );
}
