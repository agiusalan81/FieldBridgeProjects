import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import icon from "@/assets/icon-fieldbridge-projects.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/components/fb/SignaturePad";
import { getSignoff, submitSignoff } from "@/lib/signoff.functions";
import { signoffOpen } from "@/lib/signoff";
import { eur } from "@/lib/db";

export const Route = createFileRoute("/sign/$token")({
  head: () => ({ meta: [{ title: "Remote sign-off · FieldBridge Projects" }, { name: "description", content: "Review site photos and sign off a FieldBridge Projects item remotely." }, { name: "robots", content: "noindex" }, { property: "og:title", content: "Remote sign-off · FieldBridge Projects" }, { property: "og:description", content: "Review and sign a site item." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SignPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = any;
function SignPage() {
  const { token } = Route.useParams();
  const load = useServerFn(getSignoff); const submit = useServerFn(submitSignoff);
  const [r, setR] = useState<R | null | undefined>(undefined);
  const [name, setName] = useState(""); const [note, setNote] = useState(""); const [sig, setSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); const [zoom, setZoom] = useState<string | null>(null);
  useEffect(() => { load({ data: { token } }).then(setR).catch(() => setR(null)); }, [token]);
  async function go(decision: "Approved" | "Rejected") {
    if (!sig || name.trim().length < 2) { toast.error("Type your full name and sign"); return; }
    if (decision === "Rejected" && !note.trim()) { toast.error("Add a reason for rejecting"); return; }
    setBusy(true);
    try { await submit({ data: { token, decision, name, note, signature: sig } }); setR(await load({ data: { token } })); toast.success(`Recorded: ${decision}`); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="min-h-screen bg-shell p-4">
      <div className="mx-auto max-w-lg space-y-4 rounded-md border-t-4 border-primary bg-card p-5">
        <div className="flex items-center gap-2"><img src={icon} alt="FieldBridge Projects logo" width={24} height={24} className="h-6 w-6 rounded-sm" /><span className="font-display text-lg font-bold uppercase">Remote sign-off</span></div>
        {r === undefined ? <p className="text-sm">Loading…</p> : r === null ? <p className="text-sm">This link is not valid.</p> : (<>
          <div><div className="text-xs uppercase text-muted-foreground">{r.item_type} · for {r.signer_name}{r.signer_role ? ` (${r.signer_role})` : ""}</div><h1 className="font-display text-2xl font-bold">{r.title}</h1></div>
          {r.amount != null && <div className="rounded border p-3"><div className="text-xs uppercase text-muted-foreground">Value</div><div className="font-mono text-2xl font-bold">{eur(r.amount)}</div></div>}
          {r.summary && <p className="whitespace-pre-wrap text-sm">{r.summary}</p>}
          {(r.photos ?? []).length > 0 && <div className="grid grid-cols-3 gap-2">{r.photos.map((p: string, i: number) => <button key={i} onClick={() => setZoom(p)}><img src={p} alt={`Site photo ${i + 1}`} className="aspect-square w-full rounded object-cover" /></button>)}</div>}
          {zoom && <button className="fixed inset-0 z-50 flex items-center justify-center bg-shell/90 p-4" onClick={() => setZoom(null)}><img src={zoom} alt="Site photo enlarged" className="max-h-full max-w-full" /></button>}
          {signoffOpen(r) ? (<div className="space-y-2 border-t pt-3">
            <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea placeholder="Comments (required if rejecting)" value={note} onChange={(e) => setNote(e.target.value)} />
            <SignaturePad onChange={setSig} />
            <div className="grid grid-cols-2 gap-2"><Button variant="outline" disabled={busy} onClick={() => go("Rejected")}>Reject</Button><Button disabled={busy} onClick={() => go("Approved")}>Approve & sign</Button></div>
            <p className="text-xs text-muted-foreground">Your name, signature, time and device are recorded as the audit trail.</p>
          </div>) : (<div className="rounded border-2 p-3 text-sm"><b>{r.status === "Pending" ? "Link expired" : r.status}</b>{r.signed_name && <> by {r.signed_name} on {new Date(r.signed_at).toLocaleString("en-GB")}</>}{r.decision_note && <p className="mt-1">{r.decision_note}</p>}</div>)}
        </>)}
      </div>
    </div>
  );
}
