import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { useMe } from "@/components/fb/Workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, useTable, useRefresh } from "@/lib/db";
import { QA_CASES } from "@/lib/qa-cases";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/qa-hub")({
  head: () => pageHead("Live QA Hub", "Owner-only release testing checklist for FieldBridge Projects."),
  component: QaHub,
});

function QaHub() {
  const me = useMe();
  const results = useTable("qa_test_results");
  const refresh = useRefresh();
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (!me.id) return null;
  if (!me.isOwner) return <p className="p-6 text-sm text-muted-foreground">This area is restricted to the platform owner.</p>;
  const res = Object.fromEntries((results.data ?? []).map((r) => [r.test_code, r]));
  const count = (v: string) => QA_CASES.filter((c) => (res[c.code]?.verdict ?? "Pending") === v).length;
  async function set(code: string, verdict: string) {
    const { error } = await db.from("qa_test_results").upsert({ test_code: code, verdict, notes: notes[code] ?? res[code]?.notes ?? null, tested_at: new Date().toISOString() }, { onConflict: "test_code" });
    if (error) { toast.error(error.message); return; }
    refresh("qa_test_results");
  }
  const modules = [...new Set(QA_CASES.map((c) => c.module))];
  return (<>
    <PageTitle title="Live QA Hub" sub={`${count("Passed")} passed · ${count("Issue")} issues · ${count("Pending")} pending of ${QA_CASES.length}`} />
    {modules.map((m) => (
      <section key={m} className="mb-4">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{m}</h2>
        <div className="space-y-2">{QA_CASES.filter((c) => c.module === m).map((c) => { const r = res[c.code]; return (
          <div key={c.code} className="rounded-md border bg-card p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono font-bold">{c.code}</span><b>{c.title}</b><span className="ml-auto"><StatusBadge value={r?.verdict ?? "Pending"} /></span></div>
            <p className="text-muted-foreground">{c.steps} <Link to={c.route as "/"} className="font-semibold text-primary underline">Open</Link></p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Input className="h-8 flex-1" placeholder={r?.notes ?? "Notes"} value={notes[c.code] ?? ""} onChange={(e) => setNotes({ ...notes, [c.code]: e.target.value })} />
              <Button size="sm" onClick={() => set(c.code, "Passed")}>Passed</Button>
              <Button size="sm" variant="destructive" onClick={() => set(c.code, "Issue")}>Issue</Button>
              <Button size="sm" variant="outline" onClick={() => set(c.code, "Pending")}>Reset</Button>
            </div>
            {r?.tested_at && <p className="mt-1 text-xs text-muted-foreground">Last run {new Date(r.tested_at).toLocaleString()}</p>}
          </div>); })}</div>
      </section>
    ))}
  </>);
}
