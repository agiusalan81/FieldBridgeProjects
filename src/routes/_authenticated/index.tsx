import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudRain, Thermometer, Mountain, Users, HelpCircle, Bug, Receipt, CalendarClock, Gauge, AlertTriangle } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { useTable, byId, eur, isOverdue, finalAccount } from "@/lib/db";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/")({
  head: () => pageHead("Project Control Centre", "Live programme, headcount, RFIs, snags and variations for St. Michael's Commercial Complex."),
  component: Dashboard,
});

function Metric({ icon: Icon, label, value, sub, alert }: { icon: typeof Users; label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={`rounded-md border bg-card p-4 ${alert ? "border-destructive" : ""}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div>
      <div className="mt-1 font-display text-4xl font-bold">{value}</div>
      {sub && <div className={`text-xs ${alert ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}

function Dashboard() {
  const projects = useTable("projects");
  const diaries = useTable("daily_site_diaries", { order: "log_date", asc: false });
  const returns = useTable("subcontractor_daily_returns", { order: "created_at", asc: false });
  const rfis = useTable("rfis");
  const snags = useTable("snags");
  const vars = useTable("variations");
  const levels = useTable("project_levels_zones", { order: "sequence_order", asc: false });
  const subs = byId(useTable("subcontractors").data);
  const pkgs = byId(useTable("trade_packages").data);
  const lv = byId(levels.data);

  const p = projects.data?.[0];
  const diary = diaries.data?.[0];
  const todays = (returns.data ?? []).filter((r) => r.daily_site_diary_id === diary?.id);
  const headcount = todays.reduce((s, r) => s + r.operative_count, 0);
  const openRfis = (rfis.data ?? []).filter((r) => !["Closed", "Answered"].includes(r.status));
  const overdue = openRfis.filter(isOverdue).length;
  const sn = snags.data ?? [];
  const closed = sn.filter((s) => s.status === "Verified & Closed").length;
  const fa = finalAccount(p?.original_contract_sum ?? 0, vars.data ?? []);
  const weeks = p ? Math.max(0, Math.round((new Date(p.practical_completion_date).getTime() - Date.now()) / 6048e5)) : 0;

  return (
    <>
      <PageTitle title="Project Control Centre" sub={p ? `${p.project_number} · ${p.name} · Employer: ${p.employer_name}` : "Loading…"} />
      {diary && (
        <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-shell px-4 py-3 text-sm text-shell-foreground">
          <span className="flex items-center gap-2"><CloudRain className="h-4 w-4 text-primary" />AM: {diary.weather_morning} · PM: {diary.weather_afternoon}</span>
          <span className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-primary" />{diary.min_temp_c}°C – {diary.max_temp_c}°C</span>
          <span className="flex items-center gap-2"><Mountain className="h-4 w-4 text-primary" />{diary.ground_conditions}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Metric icon={Gauge} label="Programme" value={`${p?.programme_percent ?? 0}%`} sub="complete vs master programme" />
        <Metric icon={CalendarClock} label="To Practical Completion" value={`${weeks} wks`} sub={p?.practical_completion_date} />
        <Metric icon={Users} label="Operatives on site" value={String(headcount)} sub={`${todays.length} packages returned today`} />
        <Metric icon={HelpCircle} label="Open RFIs" value={String(openRfis.length)} sub={`${overdue} overdue`} alert={overdue > 0} />
        <Metric icon={Bug} label="Active snags" value={String(sn.length - closed)} sub={`De-snag ${sn.length ? Math.round((closed / sn.length) * 100) : 0}% closed`} />
        <Metric icon={Receipt} label="Approved variations" value={eur(fa.approved)} sub={`AFA ${eur(fa.total)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-md border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 font-display text-xl font-bold uppercase">Levels & Gridlines</h2>
          <div className="space-y-1.5">
            {levels.data?.map((l) => (
              <div key={l.id} className="grid grid-cols-[150px_1fr_44px] items-center gap-3 text-sm">
                <div><div className="font-semibold">{l.level_code.split(" - ")[0]}</div><div className="truncate text-[11px] text-muted-foreground">{l.gridlines}</div></div>
                <div className="h-6 overflow-hidden rounded-sm bg-secondary"><div className={`h-full ${l.progress_percent >= 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${l.progress_percent}%` }} /></div>
                <div className="text-right font-mono text-xs">{l.progress_percent}%</div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-md border bg-card p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-bold uppercase">Today's Site Activity</h2><Link to="/returns" className="text-sm font-semibold text-info">Log a return →</Link></div>
          {diary?.critical_delays && <div className="mb-3 flex gap-2 rounded-sm border-l-4 border-destructive bg-muted p-2 text-sm"><AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />{diary.critical_delays}</div>}
          <ul className="divide-y">
            {todays.map((r) => (
              <li key={r.id} className="py-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{pkgs[r.package_id]?.package_code}</span>
                  <span className="font-semibold">{subs[r.subcontractor_id]?.company_name}</span>
                  <span className="text-muted-foreground">· {lv[r.level_zone_id]?.level_code}</span>
                  <span className="ml-auto font-mono text-xs">{r.operative_count} ops · {r.total_hours_worked}h</span>
                </div>
                <div className="text-muted-foreground">{r.work_carried_out}{r.plant_on_site ? ` · Plant: ${r.plant_on_site}` : ""}</div>
                {r.delay_encountered && <div className="mt-1"><StatusBadge value="Delay" className="mr-2" /><span className="text-destructive">{r.delay_hours}h delay — {r.delay_cause}</span></div>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
