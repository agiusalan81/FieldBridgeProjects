import { createFileRoute } from "@tanstack/react-router";
import { ItemChat } from "@/components/fb/Collab";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, CalendarClock, Clock } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { db, useTable, useRefresh, byId, isOverdue } from "@/lib/db";
import { pageHead } from "@/lib/head";
import { DeleteMistake, ToVariation } from "@/components/fb/Workflow";

export const Route = createFileRoute("/_authenticated/rfis")({
  head: () => pageHead("RFI Register", "Requests for Information with level and gridline stamps, programme impact and consultant responses."),
  component: Rfis,
});

const FILTERS = ["All", "Draft", "Open", "Overdue", "Under Review", "Answered", "Closed"];

function Rfis() {
  const rfis = useTable("rfis", { order: "rfi_number", asc: false });
  const lv = byId(useTable("project_levels_zones").data);
  const dw = byId(useTable("drawings").data);
  const refresh = useRefresh();
  const [filter, setFilter] = useState("All");
  const [selId, setSelId] = useState<string | null>(null);
  const [resp, setResp] = useState("");
  const sel = rfis.data?.find((r) => r.id === selId);
  const status = (r: { status: string }) => (isOverdue(r) ? "Overdue" : r.status);
  const list = (rfis.data ?? []).filter((r) => filter === "All" || status(r) === filter);

  async function patch(p: Record<string, unknown>, msg: string) {
    const { error } = await db.from("rfis").update(p).eq("id", selId);
    if (error) { toast.error(error.message); return; }
    toast.success(msg); refresh("rfis");
  }

  return (
    <>
      <PageTitle title="RFIs & Technical Queries" sub={`${rfis.data?.length ?? 0} RFIs · ${(rfis.data ?? []).filter(isOverdue).length} overdue`} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>)}
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-shell text-left text-xs uppercase tracking-wide text-shell-foreground">
            <tr><th className="p-3">RFI</th><th>Title</th><th>Location</th><th>Discipline</th><th>Impact</th><th>Required</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} onClick={() => { setSelId(r.id); setResp(r.official_response ?? ""); }} className="cursor-pointer border-t hover:bg-muted">
                <td className="p-3 font-mono font-bold">{r.rfi_number}</td>
                <td className="max-w-xs font-medium">{r.title}</td>
                <td className="text-xs">{lv[r.level_zone_id]?.level_code.split(" - ")[0]} · {r.gridline_ref}</td>
                <td className="text-xs">{r.discipline}</td>
                <td className="text-xs">{r.programme_impact_days ? `${r.programme_impact_days}d` : "—"} · {r.cost_impact}</td>
                <td className={`font-mono text-xs ${isOverdue(r) ? "font-bold text-destructive" : ""}`}>{r.date_required}</td>
                <td><StatusBadge value={status(r)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (<>
            <SheetHeader><SheetTitle className="font-display text-2xl uppercase">{sel.rfi_number}</SheetTitle></SheetHeader>
            <div className="space-y-4 px-4 pb-6">
              <div className="flex flex-wrap gap-2"><StatusBadge value={status(sel)} /><StatusBadge value={sel.cost_impact} /></div>
              <h3 className="text-lg font-semibold">{sel.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded border p-2"><MapPin className="mb-1 h-4 w-4 text-primary" />{lv[sel.level_zone_id]?.level_code}<br /><b>{sel.gridline_ref}</b></div>
                <div className="rounded border p-2"><Clock className="mb-1 h-4 w-4 text-primary" />Programme impact<br /><b>{sel.programme_impact_days} days</b></div>
                <div className="rounded border p-2"><CalendarClock className="mb-1 h-4 w-4 text-primary" />Raised {sel.date_raised}<br />Required <b>{sel.date_required}</b></div>
                <div className="rounded border p-2">Drawing<br /><b className="font-mono">{dw[sel.drawing_id]?.sheet_number ?? "—"}</b></div>
              </div>
              <div><div className="text-xs font-bold uppercase text-muted-foreground">Query</div><p className="text-sm">{sel.query_details}</p></div>
              <div className="flex flex-wrap gap-2">
                <ItemChat itemType="rfi" itemId={sel.id} label={sel.rfi_number} />
                <DeleteMistake table="rfis" row={sel} label={sel.rfi_number} onDone={() => setSelId(null)} />
                {sel.cost_impact && sel.cost_impact !== "None" && <ToVariation source="rfi" sourceId={sel.id} linkTable="rfis" title={`${sel.rfi_number}: ${sel.title}`} scope={sel.official_response ?? sel.query_details} eot={sel.programme_impact_days ?? undefined} disabled={!!sel.variation_id} />}
              </div>
              <div className="text-sm">Assigned: <b>{sel.assigned_consultant ?? "Unassigned"}</b></div>
              <div className="rounded-md border-2 border-shell p-3">
                <div className="mb-2 text-xs font-bold uppercase">Engineer / Architect formal response</div>
                {sel.official_response && <p className="mb-2 text-sm">{sel.official_response}<br /><span className="text-xs text-muted-foreground">Signed off {sel.response_date}</span></p>}
                {!["Answered", "Closed"].includes(sel.status) && (<>
                  <Textarea value={resp} onChange={(e) => setResp(e.target.value)} placeholder="Enter formal response…" />
                  <Button className="mt-2 w-full" onClick={() => resp.trim() && patch({ official_response: resp, status: "Answered", response_date: new Date().toISOString().slice(0, 10) }, "Response issued")}>Issue response & sign off</Button>
                </>)}
                {sel.status === "Answered" && <Button variant="outline" className="w-full" onClick={() => patch({ status: "Closed" }, "RFI closed")}>Close RFI</Button>}
                {sel.status === "Draft" && <Button variant="outline" className="mt-2 w-full" onClick={() => patch({ status: "Open" }, "RFI issued")}>Issue RFI</Button>}
              </div>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </>
  );
}
