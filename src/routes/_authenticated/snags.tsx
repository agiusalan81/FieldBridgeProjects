import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { SnagCard } from "@/components/fb/SnagCard";
import { QuickCreate } from "@/components/fb/QuickCreate";
import { Button } from "@/components/ui/button";
import { RegisterFilter } from "@/components/fb/RegisterFilter";
import { matchesRegister } from "@/lib/issue-register";
import { useTable, byId } from "@/lib/db";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/snags")({
  head: () => pageHead("Snagging & Quality", "Defects register: open, fixed by subcontractor, re-inspected and closed by the Site Agent."),
  component: Snags,
});

function Snags() {
  const snags = useTable("snags", { order: "snag_number", asc: false });
  const levels = useTable("project_levels_zones", { order: "sequence_order" });
  const packages = useTable("trade_packages", { order: "package_code" });
  const subs = useTable("subcontractors", { order: "company_name" });
  const lv = byId(levels.data); const pk = byId(packages.data);
  const [pkg, setPkg] = useState("all"); const [lvl, setLvl] = useState("all"); const [sev, setSev] = useState("all");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("All");
  const [party, setParty] = useState("all");
  const filtered = (snags.data ?? []).filter((s) => matchesRegister(s, { status: "All", level: lvl, party, package: pkg, severity: sev }));
  const list = filtered.filter((s) => status === "All" || s.status === status);
  const cols = ["Open", "Fixed - Awaiting Re-inspection", "Verified & Closed"];
  const statusLabel = (s: string) => s === "Fixed - Awaiting Re-inspection" ? "Rectified" : s;
  return (
    <>
      <PageTitle title="Snagging & Quality Walkaround" sub="Open → Fixed by subcontractor → Re-inspected & closed by Site Agent">
        <Button size="lg" onClick={() => setOpen(true)}><Plus />New snag</Button>
      </PageTitle>
      {snags.error && <p role="alert" className="mb-3 text-sm text-destructive">{snags.error.message}</p>}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["All", ...cols].map((s) => <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>{statusLabel(s)} · {filtered.filter((item) => s === "All" || item.status === s).length}</Button>)}
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <RegisterFilter label="packages" value={pkg} onChange={setPkg} items={(packages.data ?? []).map((p) => [p.id, `${p.package_code} ${p.package_name}`])} />
        <RegisterFilter label="levels" value={lvl} onChange={setLvl} items={(levels.data ?? []).map((l) => [l.id, l.level_code])} />
        <RegisterFilter label="subcontractors" value={party} onChange={setParty} items={(subs.data ?? []).map((s) => [s.id, s.company_name])} />
        <RegisterFilter label="severities" value={sev} onChange={setSev} items={["Critical / Life Safety", "Major Defect", "Minor Cosmetic"].map((s) => [s, s])} />
      </div>
      {!snags.isPending && !list.length && <p className="py-6 text-sm text-muted-foreground">No snags match these filters.</p>}
      <div className={status === "All" ? "grid min-w-0 gap-4 lg:grid-cols-3" : "grid min-w-0 gap-4"}>
        {cols.filter((c) => status === "All" || c === status).map((c) => { const items = list.filter((s) => s.status === c); return (
          <section key={c} className="min-w-0">
            <h2 className="mb-2 flex items-center justify-between gap-2 rounded-sm bg-shell px-3 py-2 text-sm font-bold uppercase text-shell-foreground"><span>{c}</span><span className="font-mono text-primary">{items.length}</span></h2>
            <div className={status === "All" ? "grid gap-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>{items.map((s) => <SnagCard key={s.id} s={s} level={lv[s.level_zone_id]?.level_code} pkg={pk[s.package_id]?.package_name} canVerify />)}</div>
          </section>); })}
      </div>
      <QuickCreate open={open} onOpenChange={setOpen} initial={{ kind: "snag" }} />
    </>
  );
}
