import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { DeleteMistake } from "@/components/fb/Workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db, PROJECT_ID, useTable, useRefresh, eur, type Row } from "@/lib/db";
import { claimCertificate, complianceStatus } from "@/lib/workflow";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/sub-portal")({
  head: () => pageHead("Subcontractor Portal", "Sub Lite portal: compliance documents, monthly payment claims and QS certification."),
  component: SubPortal,
});

function SubPortal() {
  const subs = useTable("subcontractors", { order: "company_name" });
  const docs = useTable("subcontractor_compliance", { order: "expiry_date" });
  const claims = useTable("subcontractor_claims", { order: "claim_number", asc: false });
  const refresh = useRefresh();
  const [subId, setSubId] = useState<string>("");
  const sub = subs.data?.find((s) => s.id === subId) ?? subs.data?.[0];
  const myDocs = (docs.data ?? []).filter((d) => d.subcontractor_id === sub?.id);
  const myClaims = (claims.data ?? []).filter((c) => c.subcontractor_id === sub?.id);
  const blocked = myDocs.some((d) => complianceStatus(d.expiry_date) === "Expired");
  const [doc, setDoc] = useState({ doc_type: "Public Liability Insurance", reference: "", expiry_date: "" });
  const [claim, setClaim] = useState({ period_end: "", claimed_gross: "" });
  const [cert, setCert] = useState<Record<string, { amount: string; notes: string }>>({});

  async function addDoc(e: React.FormEvent) {
    e.preventDefault(); if (!sub) return;
    const { error } = await db.from("subcontractor_compliance").insert({ subcontractor_id: sub.id, ...doc, expiry_date: doc.expiry_date || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Document recorded"); setDoc({ ...doc, reference: "", expiry_date: "" }); refresh("subcontractor_compliance");
  }
  async function addClaim(e: React.FormEvent) {
    e.preventDefault(); if (!sub) return;
    const prev = myClaims.filter((c) => c.status === "Certified").reduce((s, c) => s + claimCertificate(c).due, 0);
    const { error } = await db.from("subcontractor_claims").insert({ project_id: PROJECT_ID, subcontractor_id: sub.id, claim_number: (myClaims[0]?.claim_number ?? 0) + 1, period_end: claim.period_end, claimed_gross: Number(claim.claimed_gross), previous_certified: prev, status: "Submitted" });
    if (error) { toast.error(error.message); return; }
    toast.success("Claim submitted to the QS"); setClaim({ period_end: "", claimed_gross: "" }); refresh("subcontractor_claims");
  }
  async function certify(c: Row) {
    const v = cert[c.id];
    const amount = Number(v?.amount || c.claimed_gross);
    const { error } = await db.from("subcontractor_claims").update({ certified_gross: amount, qs_notes: v?.notes || null, status: "Certified" }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment certificate issued"); refresh("subcontractor_claims");
  }
  async function toBooks(c: Row) {
    const { error } = await db.from("subcontractor_claims").update({ books_sync_status: "Queued for Books" }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Queued as a supplier bill in FieldBridge Books"); refresh("subcontractor_claims");
  }

  return (<>
    <PageTitle title="Subcontractor Portal" sub="Sub Lite · compliance, daily returns and monthly payment claims">
      <select aria-label="Subcontractor" className="h-9 rounded-md border bg-background px-2 text-sm" value={sub?.id ?? ""} onChange={(e) => setSubId(e.target.value)}>{subs.data?.map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}</select>
    </PageTitle>
    {blocked && <div className="mb-4 flex items-center gap-2 rounded-md border-2 border-destructive bg-destructive/10 p-3 text-sm"><ShieldAlert className="h-5 w-5 text-destructive" /><b>Compliance gate:</b> expired documents — new payment claims are blocked and the Site Agent has been flagged until renewed.</div>}
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-2 rounded-md border bg-card p-4">
        <h2 className="font-display text-xl font-bold uppercase">Compliance & RAMS</h2>
        {myDocs.map((d) => (
          <div key={d.id} className="flex items-center gap-2 border-t pt-2 text-sm"><span className="flex-1"><b>{d.doc_type}</b> <span className="text-muted-foreground">{d.reference}</span></span><span className="font-mono text-xs">{d.expiry_date ?? "—"}</span><StatusBadge value={complianceStatus(d.expiry_date)} /><DeleteMistake table="subcontractor_compliance" row={d} label={d.doc_type} /></div>
        ))}
        <form onSubmit={addDoc} className="grid gap-2 border-t pt-3 sm:grid-cols-2">
          <select aria-label="Document type" className="h-9 rounded-md border bg-background px-2 text-sm" value={doc.doc_type} onChange={(e) => setDoc({ ...doc, doc_type: e.target.value })}>{["Public Liability Insurance", "Employer's Liability", "RAMS", "Tax Clearance", "Skills Cards"].map((t) => <option key={t}>{t}</option>)}</select>
          <Input placeholder="Reference / policy no." value={doc.reference} onChange={(e) => setDoc({ ...doc, reference: e.target.value })} />
          <Input type="date" aria-label="Expiry" required value={doc.expiry_date} onChange={(e) => setDoc({ ...doc, expiry_date: e.target.value })} />
          <Button type="submit">Add / renew</Button>
        </form>
        <Link to="/returns" className="block pt-2 text-sm font-semibold text-primary underline">Log today's daily return →</Link>
      </section>
      <section className="space-y-2 rounded-md border bg-card p-4">
        <h2 className="font-display text-xl font-bold uppercase">Payment claims</h2>
        {myClaims.map((c) => { const certified = c.status === "Certified"; const { retention, due } = certified ? claimCertificate(c) : { retention: 0, due: 0 }; return (
          <div key={c.id} className="space-y-1 border-t pt-2 text-sm">
            <div className="flex items-center gap-2"><b>Claim #{c.claim_number}</b><span className="text-muted-foreground">to {c.period_end}</span><span className="ml-auto"><StatusBadge value={c.status} /></span></div>
            <div>Claimed {eur(c.claimed_gross)}{certified && <> · Certified {eur(c.certified_gross)} · Retention {eur(retention)} · <b>Due {eur(due)}</b></>}</div>
            {c.qs_notes && <p className="text-xs">QS: {c.qs_notes}</p>}
            {c.status === "Submitted" && (<div className="grid gap-1 sm:grid-cols-[140px_1fr_auto]">
              <Input type="number" placeholder="Certify €" value={cert[c.id]?.amount ?? ""} onChange={(e) => setCert({ ...cert, [c.id]: { notes: cert[c.id]?.notes ?? "", amount: e.target.value } })} />
              <Textarea className="min-h-9" placeholder="QS assessment notes (reasons for cuts)" value={cert[c.id]?.notes ?? ""} onChange={(e) => setCert({ ...cert, [c.id]: { amount: cert[c.id]?.amount ?? "", notes: e.target.value } })} />
              <Button size="sm" onClick={() => certify(c)}>Certify</Button>
            </div>)}
            {certified && (c.books_sync_status === "Not sent" ? <Button size="sm" variant="outline" onClick={() => toBooks(c)}>Send to FieldBridge Books</Button> : <StatusBadge value={c.books_sync_status} />)}
            <DeleteMistake table="subcontractor_claims" row={c} label={`claim #${c.claim_number}`} />
          </div>); })}
        <form onSubmit={addClaim} className="grid gap-2 border-t pt-3 sm:grid-cols-3">
          <Input type="date" required aria-label="Period end" value={claim.period_end} onChange={(e) => setClaim({ ...claim, period_end: e.target.value })} />
          <Input type="number" required min="0" placeholder="Cumulative gross €" value={claim.claimed_gross} onChange={(e) => setClaim({ ...claim, claimed_gross: e.target.value })} />
          <Button type="submit" disabled={blocked}>{blocked ? "Blocked" : "Submit claim"}</Button>
        </form>
      </section>
    </div>
  </>);
}
