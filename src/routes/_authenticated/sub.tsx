import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, HardHat, Hammer, Bug, Receipt } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db, PROJECT_ID, useTable, useRefresh, eur, byId, type Row } from "@/lib/db";
import { nextNumber, needsClientApproval } from "@/lib/workflow";
import { photoToDataUrl } from "@/lib/photo";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/sub")({
  head: () => pageHead("Sub Lite", "Simple phone hub for trade crews: headcount, extra-work quotes, snag fixes and monthly claims."),
  component: SubLite,
});

function SubLite() {
  const subs = useTable("subcontractors", { order: "company_name" });
  const quotes = useTable("extra_work_quotes", { order: "created_at", asc: false });
  const snags = useTable("snags");
  const diaries = useTable("daily_site_diaries", { order: "log_date", asc: false });
  const project = useTable("projects").data?.find((x) => x.id === PROJECT_ID);
  const refresh = useRefresh();
  const [subId, setSubId] = useState("");
  const [tab, setTab] = useState<"home" | "headcount" | "extra">("home");
  useEffect(() => { if (!subId && subs.data?.[0]) setSubId(subs.data[0].id); }, [subs.data, subId]);
  const sub = byId(subs.data)[subId];
  const mine = (quotes.data ?? []).filter((q) => q.subcontractor_id === subId);
  const mySnags = (snags.data ?? []).filter((s) => s.subcontractor_id === subId && !String(s.status).includes("Closed"));
  const threshold = Number(project?.client_approval_threshold ?? 5000);

  return (
    <div className="space-y-6">
      <PageTitle title="Sub Lite" sub={project?.sponsor_sub_passes ? "Sponsored pass — free for your crew" : "Trade crew phone hub"} />
      <div className="mx-auto max-w-md space-y-4 rounded-xl border-4 border-shell bg-card p-4">
        <select aria-label="Subcontractor" className="h-11 w-full rounded border bg-background px-3 font-semibold" value={subId} onChange={(e) => { setSubId(e.target.value); setTab("home"); }}>
          {(subs.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
        </select>
        {tab === "home" && <div className="grid grid-cols-2 gap-3">
          <Tile icon={HardHat} label="Log headcount" onClick={() => setTab("headcount")} />
          <Tile icon={Hammer} label="Extra works quote" onClick={() => setTab("extra")} />
          <Link to="/snags" className="flex flex-col items-center gap-2 rounded-lg bg-secondary p-5 text-center text-sm font-bold"><Bug className="h-7 w-7 text-primary" />My snags ({mySnags.length})</Link>
          <Link to="/sub-portal" className="flex flex-col items-center gap-2 rounded-lg bg-secondary p-5 text-center text-sm font-bold"><Receipt className="h-7 w-7 text-primary" />Monthly claim</Link>
        </div>}
        {tab === "headcount" && sub && <Headcount sub={sub} diaryId={diaries.data?.[0]?.id} onDone={() => setTab("home")} />}
        {tab === "extra" && sub && <ExtraQuote sub={sub} all={quotes.data ?? []} onDone={() => { setTab("home"); refresh("extra_work_quotes"); }} />}
        {tab !== "home" && <Button variant="ghost" className="w-full" onClick={() => setTab("home")}>Back</Button>}
        <div>
          <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">My quotes</div>
          {mine.length === 0 && <p className="text-sm text-muted-foreground">No extra-work quotes yet.</p>}
          {mine.map((q) => <div key={q.id} className="flex items-center justify-between border-t py-2 text-sm"><span>{q.quote_number} · {q.description.slice(0, 30)}</span><span className="flex items-center gap-2">{eur(q.amount)}<StatusBadge value={q.status} /></span></div>)}
        </div>
      </div>
      <Inbox quotes={(quotes.data ?? []).filter((q) => q.status === "Pending")} subs={byId(subs.data)} threshold={threshold} onDone={() => refresh("extra_work_quotes", "variations")} />
    </div>
  );
}

function Tile({ icon: I, label, onClick }: { icon: typeof Bug; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex flex-col items-center gap-2 rounded-lg bg-secondary p-5 text-sm font-bold"><I className="h-7 w-7 text-primary" />{label}</button>;
}

function Headcount({ sub, diaryId, onDone }: { sub: Row; diaryId?: string; onDone: () => void }) {
  const [n, setN] = useState("2"); const [hrs, setHrs] = useState("8"); const [work, setWork] = useState("");
  async function save() {
    const { error } = await db.from("subcontractor_daily_returns").insert({ daily_site_diary_id: diaryId ?? null, subcontractor_id: sub.id, package_id: sub.package_id, operative_count: Number(n), total_hours_worked: Number(n) * Number(hrs), work_carried_out: work || null, delay_encountered: false });
    if (error) toast.error(error.message); else { toast.success("Headcount logged"); onDone(); }
  }
  return <div className="space-y-2">
    <label className="block text-xs font-semibold">Workers on site today<Input type="number" value={n} onChange={(e) => setN(e.target.value)} className="h-12 text-lg" /></label>
    <label className="block text-xs font-semibold">Hours each<Input type="number" value={hrs} onChange={(e) => setHrs(e.target.value)} /></label>
    <Textarea placeholder="Work done today" value={work} onChange={(e) => setWork(e.target.value)} />
    <Button className="h-12 w-full" onClick={save}>Log headcount</Button>
  </div>;
}

function ExtraQuote({ sub, all, onDone }: { sub: Row; all: Row[]; onDone: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string>(); const [desc, setDesc] = useState(""); const [amount, setAmount] = useState("");
  async function send() {
    const { error } = await db.from("extra_work_quotes").insert({ project_id: PROJECT_ID, subcontractor_id: sub.id, quote_number: nextNumber("EW", all.map((q) => q.quote_number)), description: desc, amount: Number(amount), photo_url: photo ?? null });
    if (error) toast.error(error.message); else { toast.success("Sent for approval — don't start until approved"); onDone(); }
  }
  return <div className="space-y-2">
    <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await photoToDataUrl(f)); }} />
    {photo ? <img src={photo} alt="Extra work location" className="max-h-40 rounded" /> : <Button variant="outline" className="w-full" onClick={() => ref.current?.click()}><Camera className="h-4 w-4" />Photo of location</Button>}
    <Textarea placeholder="e.g. 4 extra double sockets on terrace" value={desc} onChange={(e) => setDesc(e.target.value)} />
    <Input type="number" placeholder="Price €" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 text-lg" />
    <Button className="h-12 w-full" disabled={!desc.trim() || !Number(amount)} onClick={send}>Send for approval</Button>
  </div>;
}

function Inbox({ quotes, subs, threshold, onDone }: { quotes: Row[]; subs: Record<string, Row>; threshold: number; onDone: () => void }) {
  async function decide(q: Row, approve: boolean) {
    if (!approve) {
      const { error } = await db.from("extra_work_quotes").update({ status: "Rejected" }).eq("id", q.id);
      if (error) toast.error(error.message); else { toast.success("Quote rejected"); onDone(); }
      return;
    }
    const client = needsClientApproval(q.amount, threshold);
    const { data: ex } = await db.from("variations").select("variation_number");
    const { data: v, error } = await db.from("variations").insert({
      project_id: PROJECT_ID, variation_number: nextNumber("VO", (ex ?? []).map((x: Row) => x.variation_number)), title: `Extra works: ${q.description.slice(0, 60)}`,
      scope_description: q.description, instruction_source: `Sub Lite quote ${q.quote_number}`, source_type: "extra_work", source_id: q.id,
      subcontractor_quotation: q.amount, claimed_contractor_amount: q.amount,
      status: client ? "Submitted" : "Approved", approved_employer_amount: client ? null : q.amount,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    const { error: e2 } = await db.from("extra_work_quotes").update({ status: client ? "Awaiting Client" : "Approved", variation_id: v.id }).eq("id", q.id);
    if (e2) toast.error(e2.message); else { toast.success(client ? "Above client limit — sent to client for sign-off" : "Approved — crew can start"); onDone(); }
  }
  return (
    <section className="rounded-md border bg-card p-4">
      <h2 className="mb-2 font-display text-lg font-bold uppercase">PM inbox — extra-work quotes</h2>
      <p className="mb-2 text-xs text-muted-foreground">Up to {eur(threshold)} you approve directly; above that it goes to the client.</p>
      {quotes.length === 0 && <p className="text-sm text-muted-foreground">Nothing waiting.</p>}
      {quotes.map((q) => (
        <div key={q.id} className="flex flex-wrap items-center gap-3 border-t py-3 text-sm">
          {q.photo_url && <img src={q.photo_url} alt="" className="h-14 w-14 rounded object-cover" />}
          <div className="flex-1"><b>{q.quote_number}</b> · {subs[q.subcontractor_id]?.company_name}<div>{q.description}</div></div>
          <div className="font-bold">{eur(q.amount)}{needsClientApproval(q.amount, threshold) && <div className="text-xs font-normal text-destructive">Client sign-off</div>}</div>
          <Button size="sm" onClick={() => decide(q, true)}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => decide(q, false)}>Reject</Button>
        </div>
      ))}
    </section>
  );
}
