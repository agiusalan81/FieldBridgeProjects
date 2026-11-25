import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Send, PenLine, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { db, PROJECT_ID, useTable, useRefresh, type Row } from "@/lib/db";
import { useMe } from "./Workflow";
import { StatusBadge } from "./StatusBadge";

/** Threaded chat attached to one record (RFI, snag, daywork, variation). */
export function ItemChat({ itemType, itemId, label }: { itemType: string; itemId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const me = useMe();
  const msgs = useTable("item_messages", { order: "created_at", filter: ["item_id", itemId] });
  const refresh = useRefresh();
  const [body, setBody] = useState("");
  useEffect(() => {
    if (!open) return;
    const ch = supabase.channel(`chat-${itemId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "item_messages", filter: `item_id=eq.${itemId}` }, () => refresh("item_messages"))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, itemId]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const b = body.trim().slice(0, 2000); if (!b) return;
    const { error } = await db.from("item_messages").insert({ project_id: PROJECT_ID, item_type: itemType, item_id: itemId, body: b, author_email: me.email ?? null });
    if (error) toast.error(error.message); else { setBody(""); refresh("item_messages"); }
  }
  const n = msgs.data?.length ?? 0;
  return (<>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}><MessageSquare className="h-4 w-4" />Chat{n ? ` (${n})` : ""}</Button>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display uppercase">Chat · {label}</SheetTitle></SheetHeader>
        <div className="flex-1 space-y-2 overflow-y-auto px-4">
          {n === 0 && <p className="text-sm text-muted-foreground">No messages yet. Everything said here stays with this record.</p>}
          {msgs.data?.map((m: Row) => { const mine = m.author_id === me.id; return (
            <div key={m.id} className={`max-w-[85%] rounded-md p-2 text-sm ${mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
              <div className="text-[10px] opacity-75">{m.author_email ?? "Team"} · {new Date(m.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>); })}
        </div>
        <form onSubmit={send} className="flex gap-2 p-4"><Input placeholder="Write a message…" value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} /><Button type="submit" size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button></form>
      </SheetContent>
    </Sheet>
  </>);
}

/** Create a secure link an off-site signatory opens on their phone to review photos and sign. */
export function RequestSignoff({ itemType, itemId, title, summary, amount, photos = [] }: { itemType: string; itemId: string; title: string; summary?: string | null; amount?: number | null; photos?: (string | null | undefined)[] }) {
  const [open, setOpen] = useState(false);
  const reqs = useTable("signoff_requests", { filter: ["item_id", itemId], order: "created_at", asc: false });
  const refresh = useRefresh();
  const [f, setF] = useState({ signer_name: "", signer_email: "", signer_role: "Client / Director" });
  const latest = reqs.data?.[0];
  const linkFor = (t: string) => `${window.location.origin}/sign/${t}`;
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (f.signer_name.trim().length < 2) { toast.error("Enter who must sign"); return; }
    const { data, error } = await db.from("signoff_requests").insert({ project_id: PROJECT_ID, item_type: itemType, item_id: itemId, title: title.slice(0, 200), summary: summary ?? null, amount: amount ?? null, photos: photos.filter(Boolean), signer_name: f.signer_name.trim().slice(0, 100), signer_email: f.signer_email.trim() || null, signer_role: f.signer_role }).select("token").single();
    if (error) { toast.error(error.message); return; }
    try { await navigator.clipboard.writeText(linkFor(data.token)); } catch { /* optional */ }
    toast.success("Sign-off link copied — send it by email or WhatsApp"); refresh("signoff_requests");
  }
  return (<>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}><PenLine className="h-4 w-4" />{latest && latest.status !== "Pending" ? `Remote: ${latest.status}` : latest ? "Remote: awaiting" : "Remote sign-off"}</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display uppercase">Remote sign-off · {title}</DialogTitle></DialogHeader>
        <form onSubmit={create} className="space-y-2">
          <Input placeholder="Signatory name" value={f.signer_name} onChange={(e) => setF({ ...f, signer_name: e.target.value })} />
          <Input type="email" placeholder="Signatory email (optional)" value={f.signer_email} onChange={(e) => setF({ ...f, signer_email: e.target.value })} />
          <select aria-label="Signatory role" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.signer_role} onChange={(e) => setF({ ...f, signer_role: e.target.value })}>{["Client / Director", "Project Manager", "Architect / Perit", "Quantity Surveyor"].map((r) => <option key={r}>{r}</option>)}</select>
          <p className="text-xs text-muted-foreground">They see the description, value and {photos.filter(Boolean).length} photo(s), then sign on screen. Link valid 14 days, single use.</p>
          <Button type="submit" className="w-full">Create link & copy</Button>
        </form>
        <ul className="space-y-1 text-sm">{reqs.data?.map((r: Row) => (
          <li key={r.id} className="flex items-center gap-2 rounded border p-2"><span className="flex-1">{r.signer_name} <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-GB")}</span>{r.signed_name && <div className="text-xs">Signed by {r.signed_name} · {new Date(r.signed_at).toLocaleString("en-GB")}</div>}</span>
            <StatusBadge value={r.status} />
            {r.signature_data_url && <img src={r.signature_data_url} alt="Signature" className="h-8 rounded border bg-card" />}
            {r.status === "Pending" && <Button size="icon" variant="ghost" aria-label="Copy link" onClick={async () => { await navigator.clipboard.writeText(linkFor(r.token)); toast.success("Link copied"); }}><Copy className="h-4 w-4" /></Button>}
          </li>))}</ul>
      </DialogContent>
    </Dialog>
  </>);
}
