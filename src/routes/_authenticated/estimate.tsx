import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/fb/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, PROJECT_ID, useTable, useRefresh, eur, finalAccount } from "@/lib/db";
import { estimateLine, estimateTotals } from "@/lib/estimate";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/estimate")({
  head: () => pageHead("Estimate & Budget", "Project cost plan: budget vs committed orders vs variations, by section."),
  component: EstimatePage,
});

const SECTIONS = ["Preliminaries", "Substructure", "Superstructure", "Envelope", "MEP", "Finishes", "External Works", "Contingency"];

function EstimatePage() {
  const lines = useTable("estimate_lines", { order: "sort_order" });
  const vos = useTable("variations");
  const refresh = useRefresh();
  const [n, setN] = useState({ section: SECTIONS[0]!, description: "", budget: "", committed: "" });
  const rows = lines.data ?? [];
  const approved = finalAccount(0, vos.data ?? []).approved;
  const t = estimateTotals(rows, approved);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!n.description.trim()) return;
    const { error } = await db.from("estimate_lines").insert({ project_id: PROJECT_ID, section: n.section, description: n.description.trim().slice(0, 200), budget: Number(n.budget || 0), committed: Number(n.committed || 0), sort_order: rows.length + 1 });
    if (error) toast.error(error.message.includes("row-level") ? "Only project managers can edit the estimate" : error.message);
    else { setN({ ...n, description: "", budget: "", committed: "" }); refresh("estimate_lines"); }
  }
  async function patch(id: string, k: string, v: string) {
    const { error } = await db.from("estimate_lines").update({ [k]: Number(v || 0) }).eq("id", id);
    if (error) toast.error("Only project managers can edit the estimate"); else refresh("estimate_lines");
  }
  async function remove(id: string) {
    const { error } = await db.from("estimate_lines").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh("estimate_lines");
  }

  return (
    <div>
      <PageTitle title="Estimate & Budget" sub="Tender budget vs committed orders vs approved variations" />
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        {[["Budget", t.budget], ["Committed", t.committed], ["Forecast", t.forecast], ["Approved variations", t.approvedVariations], ["Forecast final cost", t.forecastFinal]].map(([l, v]) => (
          <div key={l as string} className="rounded-md border bg-card p-3"><div className="text-xs uppercase text-muted-foreground">{l}</div><div className="font-mono text-lg font-bold">{eur(v as number)}</div></div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-shell text-left text-xs uppercase text-shell-foreground"><tr><th className="p-3">Section</th><th>Description</th><th className="text-right">Budget</th><th className="text-right">Committed</th><th className="text-right">Variance</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => { const x = estimateLine(r); return (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-semibold">{r.section}</td><td>{r.description}</td>
                <td className="text-right"><Input className="ml-auto h-8 w-32 text-right font-mono" type="number" defaultValue={r.budget} onBlur={(e) => e.target.value !== String(r.budget) && patch(r.id, "budget", e.target.value)} /></td>
                <td className="text-right"><Input className="ml-auto h-8 w-32 text-right font-mono" type="number" defaultValue={r.committed} onBlur={(e) => e.target.value !== String(r.committed) && patch(r.id, "committed", e.target.value)} /></td>
                <td className={`text-right font-mono font-bold ${x.variance > 0 ? "text-destructive" : ""}`}>{x.variance > 0 ? "+" : ""}{eur(x.variance)}</td>
                <td className="pr-3 text-right"><Button size="sm" variant="ghost" onClick={() => remove(r.id)}>Remove</Button></td>
              </tr>); })}
          </tbody>
        </table>
      </div>
      <form onSubmit={add} className="mt-4 grid gap-2 rounded-md border bg-card p-4 md:grid-cols-5">
        <select aria-label="Section" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={n.section} onChange={(e) => setN({ ...n, section: e.target.value })}>{SECTIONS.map((s) => <option key={s}>{s}</option>)}</select>
        <Input placeholder="Description" value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} />
        <Input type="number" placeholder="Budget €" value={n.budget} onChange={(e) => setN({ ...n, budget: e.target.value })} />
        <Input type="number" placeholder="Committed €" value={n.committed} onChange={(e) => setN({ ...n, committed: e.target.value })} />
        <Button type="submit">Add line</Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">Red variance = committed orders exceed budget. Lines with nothing committed forecast at budget.</p>
    </div>
  );
}
