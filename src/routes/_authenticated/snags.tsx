import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { SnagCard } from "@/components/fb/SnagCard";
import { QuickCreate } from "@/components/fb/QuickCreate";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTable, byId } from "@/lib/db";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/snags")({
  head: () => pageHead("Snagging & Quality", "Defects register: open, fixed by subcontractor, re-inspected and closed by the Site Agent."),
  component: Snags,
});

function F({ label, value, set, items }: { label: string; value: string; set: (v: string) => void; items: [string, string][] }) {
  return (
    <Select value={value} onValueChange={set}>
      <SelectTrigger aria-label={label} className="h-11 w-full sm:w-52"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {label}</SelectItem>{items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function Snags() {
  const snags = useTable("snags", { order: "snag_number", asc: false });
  const levels = useTable("project_levels_zones", { order: "sequence_order" });
  const packages = useTable("trade_packages", { order: "package_code" });
  const lv = byId(levels.data); const pk = byId(packages.data);
  const [pkg, setPkg] = useState("all"); const [lvl, setLvl] = useState("all"); const [sev, setSev] = useState("all");
  const [open, setOpen] = useState(false);
  const list = (snags.data ?? []).filter((s) => (pkg === "all" || s.package_id === pkg) && (lvl === "all" || s.level_zone_id === lvl) && (sev === "all" || s.severity === sev));
  const cols = ["Open", "Fixed - Awaiting Re-inspection", "Verified & Closed"];
  return (
    <>
      <PageTitle title="Snagging & Quality Walkaround" sub="Open → Fixed by subcontractor → Re-inspected & closed by Site Agent">
        <Button size="lg" onClick={() => setOpen(true)}><Plus />New snag</Button>
      </PageTitle>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <F label="packages" value={pkg} set={setPkg} items={(packages.data ?? []).map((p) => [p.id, `${p.package_code} ${p.package_name}`])} />
        <F label="levels" value={lvl} set={setLvl} items={(levels.data ?? []).map((l) => [l.id, l.level_code])} />
        <F label="severities" value={sev} set={setSev} items={["Critical / Life Safety", "Major Defect", "Minor Cosmetic"].map((s) => [s, s])} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map((c) => { const items = list.filter((s) => s.status === c); return (
          <section key={c}>
            <h2 className="mb-2 flex items-center justify-between rounded-sm bg-shell px-3 py-2 text-sm font-bold uppercase text-shell-foreground">{c}<span className="font-mono text-primary">{items.length}</span></h2>
            <div className="grid gap-3">{items.map((s) => <SnagCard key={s.id} s={s} level={lv[s.level_zone_id]?.level_code} pkg={pk[s.package_id]?.package_name} canVerify />)}</div>
          </section>); })}
      </div>
      <QuickCreate open={open} onOpenChange={setOpen} initial={{ kind: "snag" }} />
    </>
  );
}
