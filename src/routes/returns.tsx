import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, AlertOctagon } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { SnagCard } from "@/components/fb/SnagCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, useTable, useRefresh, byId } from "@/lib/db";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/returns")({
  head: () => pageHead("Subcontractor Daily Return", "Log today's operatives, hours, plant, work location and delays from site."),
  component: Returns,
});

const PLANT = ["Tower crane TC-1", "50T Mobile Crane", "Scissor Lift", "MEWP / Cherry Picker", "Concrete Pump", "Telehandler", "Mini Excavator"];
const DELAYS = ["Standing time waiting for tower crane hook", "Access restricted by another package", "Power / services stoppage", "Awaiting RFI response / information", "Weather stoppage"];

function Stepper({ label, value, set, step = 1 }: { label: string; value: number; set: (n: number) => void; step?: number }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <Button size="icon" variant="outline" className="h-12 w-12" aria-label={`Decrease ${label}`} onClick={() => set(Math.max(0, value - step))}><Minus /></Button>
        <Input type="number" inputMode="decimal" value={value} onChange={(e) => set(Number(e.target.value))} className="h-12 text-center font-display text-3xl font-bold" />
        <Button size="icon" variant="outline" className="h-12 w-12" aria-label={`Increase ${label}`} onClick={() => set(value + step)}><Plus /></Button>
      </div>
    </div>
  );
}

function Returns() {
  const subs = useTable("subcontractors", { order: "company_name" });
  const levels = useTable("project_levels_zones", { order: "sequence_order" });
  const diaries = useTable("daily_site_diaries", { order: "log_date", asc: false });
  const snags = useTable("snags", { order: "snag_number" });
  const pkgs = byId(useTable("trade_packages").data);
  const lv = byId(levels.data);
  const refresh = useRefresh();
  const [subId, setSubId] = useState("30000000-0000-0000-0000-000000000007");
  const sub = subs.data?.find((s) => s.id === subId);
  const [ops, setOps] = useState(8);
  const [hours, setHours] = useState(64);
  const [plant, setPlant] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [grid, setGrid] = useState("");
  const [work, setWork] = useState("");
  const [delay, setDelay] = useState(false);
  const [delayHours, setDelayHours] = useState(1);
  const [cause, setCause] = useState(DELAYS[0]!);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!level || !work.trim()) { toast.error("Select a level and describe the work carried out"); return; }
    setSaving(true);
    const { error } = await db.from("subcontractor_daily_returns").insert({
      daily_site_diary_id: diaries.data?.[0]?.id ?? null, subcontractor_id: subId, package_id: sub?.package_id, level_zone_id: level,
      operative_count: ops, total_hours_worked: hours, plant_on_site: plant.join(", "), work_carried_out: grid ? `${work} (${grid})` : work,
      delay_encountered: delay, delay_hours: delay ? delayHours : 0, delay_cause: delay ? cause : null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Daily return submitted to Site Agent");
    refresh("subcontractor_daily_returns");
    setWork(""); setDelay(false); setPlant([]);
  }

  const mySnags = (snags.data ?? []).filter((s) => s.package_id === sub?.package_id && s.status !== "Verified & Closed");

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="Daily Return" sub={new Date().toDateString()} />
      <Select value={subId} onValueChange={setSubId}>
        <SelectTrigger aria-label="Subcontractor" className="mb-4 h-12 text-base font-semibold"><SelectValue /></SelectTrigger>
        <SelectContent>{subs.data?.map((s) => <SelectItem key={s.id} value={s.id}>{pkgs[s.package_id]?.package_code} · {s.company_name}</SelectItem>)}</SelectContent>
      </Select>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><Stepper label="Operatives" value={ops} set={setOps} /><Stepper label="Total hours" value={hours} set={setHours} step={8} /></div>
        <div className="rounded-md border bg-card p-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Plant & equipment on site</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLANT.map((p) => { const on = plant.includes(p); return (
              <button key={p} onClick={() => setPlant(on ? plant.filter((x) => x !== p) : [...plant, p])}
                className={`min-h-11 rounded-md border px-3 text-sm font-medium ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{p}</button>); })}
          </div>
        </div>
        <div className="space-y-2 rounded-md border bg-card p-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Work location & progress</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select value={level} onValueChange={setLevel}><SelectTrigger aria-label="Level" className="h-12"><SelectValue placeholder="Level / Zone" /></SelectTrigger>
              <SelectContent>{levels.data?.map((l) => <SelectItem key={l.id} value={l.id}>{l.level_code}</SelectItem>)}</SelectContent></Select>
            <Input className="h-12" placeholder={level ? lv[level]?.gridlines : "Gridlines"} value={grid} onChange={(e) => setGrid(e.target.value)} />
          </div>
          <Textarea placeholder="Work carried out today…" value={work} onChange={(e) => setWork(e.target.value)} />
        </div>
        <div className={`space-y-2 rounded-md border-2 p-3 ${delay ? "border-destructive bg-card" : "bg-card"}`}>
          <label className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-semibold"><AlertOctagon className="h-5 w-5 text-destructive" />Notice of Delay / Stoppage</span>
            <Switch checked={delay} onCheckedChange={setDelay} aria-label="Delay encountered" />
          </label>
          {delay && (<>
            <Select value={cause} onValueChange={setCause}><SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>{DELAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
            <Stepper label="Hours lost" value={delayHours} set={setDelayHours} step={0.5} />
          </>)}
        </div>
        <Button size="lg" className="h-14 w-full text-lg font-bold" onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit Daily Return"}</Button>
      </div>
      <h2 className="mb-3 mt-8 font-display text-2xl font-bold uppercase">My Trade Snags ({mySnags.length})</h2>
      <div className="grid gap-3">
        {mySnags.map((s) => <SnagCard key={s.id} s={s} level={lv[s.level_zone_id]?.level_code} pkg={pkgs[s.package_id]?.package_name} />)}
        {!mySnags.length && <p className="text-sm text-muted-foreground">No open snags for this package.</p>}
      </div>
    </div>
  );
}
