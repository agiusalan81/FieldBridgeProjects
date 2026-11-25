import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { DeleteMistake } from "@/components/fb/Workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db, PROJECT_ID, useTable, useRefresh, byId } from "@/lib/db";
import { nextNumber } from "@/lib/workflow";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/submittals")({
  head: () => pageHead("Submittals", "Technical submittals register: shop drawings, product data and samples routed to the architect or engineer for approval."),
  component: Submittals,
});

const DECISIONS = ["Approved", "Approved as Noted", "Revise & Resubmit", "Rejected"];

function Submittals() {
  const rows = useTable("submittals", { order: "submittal_number", asc: false });
  const pk = useTable("trade_packages", { order: "package_code" });
  const pkg = byId(pk.data);
  const refresh = useRefresh();
  const [f, setF] = useState({ title: "", spec_section: "", package_id: "", approver: "Lead Architect", target_date: "" });
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await db.from("submittals").insert({ project_id: PROJECT_ID, submittal_number: nextNumber("SUB", (rows.data ?? []).map((r) => r.submittal_number)), title: f.title, spec_section: f.spec_section || null, package_id: f.package_id || null, approver: f.approver, target_date: f.target_date || null, status: "Submitted" });
    if (error) { toast.error(error.message); return; }
    toast.success("Submittal issued for review"); setF({ ...f, title: "", spec_section: "" }); refresh("submittals");
  }
  async function decide(id: string, status: string) {
    const { error } = await db.from("submittals").update({ status, approver_notes: notes[id] ?? null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Submittal ${status.toLowerCase()}`); refresh("submittals");
  }
  const overdue = (r: { target_date?: string; status: string }) => r.status === "Submitted" && r.target_date && new Date(r.target_date) < new Date(new Date().toDateString());

  return (<>
    <PageTitle title="Submittals" sub="Nothing gets installed until its submittal is approved" />
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-2">
        {rows.data?.map((r) => (
          <div key={r.id} className="rounded-md border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono font-bold">{r.submittal_number}</span><StatusBadge value={r.status} />{overdue(r) && <StatusBadge value="Overdue" />}<span className="ml-auto text-xs text-muted-foreground">Due {r.target_date ?? "—"} · {r.approver}</span></div>
            <p className="mt-1 font-medium">{r.title}</p>
            <p className="text-xs text-muted-foreground">Spec {r.spec_section ?? "—"} · {pkg[r.package_id]?.package_name ?? "General"}</p>
            {r.approver_notes && <p className="mt-1 text-sm"><b>Reviewer:</b> {r.approver_notes}</p>}
            {(r.status === "Submitted" || r.status === "Revise & Resubmit") && (
              <div className="mt-2 space-y-2">
                {r.status === "Submitted" ? (<>
                  <Textarea placeholder="Reviewer comments" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                  <div className="flex flex-wrap gap-1">{DECISIONS.map((d) => <Button key={d} size="sm" variant={d.startsWith("Approved") ? "default" : "outline"} onClick={() => decide(r.id, d)}>{d}</Button>)}</div>
                </>) : <Button size="sm" variant="outline" onClick={() => decide(r.id, "Submitted")}>Resubmit revised</Button>}
              </div>
            )}
            <div className="mt-2"><DeleteMistake table="submittals" row={r} label={r.submittal_number} /></div>
          </div>
        ))}
      </div>
      <form onSubmit={create} className="h-fit space-y-2 rounded-md border bg-card p-4">
        <h2 className="font-display text-xl font-bold uppercase">New submittal</h2>
        <Input required placeholder="Title e.g. Lift car finishes samples" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input placeholder="Spec section" value={f.spec_section} onChange={(e) => setF({ ...f, spec_section: e.target.value })} />
        <select aria-label="Package" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.package_id} onChange={(e) => setF({ ...f, package_id: e.target.value })}><option value="">General</option>{pk.data?.map((p) => <option key={p.id} value={p.id}>{p.package_code} {p.package_name}</option>)}</select>
        <Input placeholder="Approver" value={f.approver} onChange={(e) => setF({ ...f, approver: e.target.value })} />
        <label className="block text-sm">Review due<Input type="date" value={f.target_date} onChange={(e) => setF({ ...f, target_date: e.target.value })} /></label>
        <Button type="submit" className="w-full">Issue for review</Button>
      </form>
    </div>
  </>);
}
