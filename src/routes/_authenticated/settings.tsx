import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/fb/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { db, PROJECT_ID, useTable, useRefresh, eur } from "@/lib/db";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("Project Settings & Team", "Client approval limit, sponsored subcontractor passes, retention defaults and project team."),
  component: SettingsPage,
});

function SettingsPage() {
  const p = useTable("projects").data?.find((x) => x.id === PROJECT_ID);
  const members = useTable("project_members", { order: "created_at" });
  const refresh = useRefresh();
  const [f, setF] = useState({ name: "", employer_name: "", site_address: "", client_approval_threshold: "5000", default_retention_percent: "5", sponsor_sub_passes: false });
  useEffect(() => { if (p) setF({ name: p.name, employer_name: p.employer_name ?? "", site_address: p.site_address ?? "", client_approval_threshold: String(p.client_approval_threshold ?? 5000), default_retention_percent: String(p.default_retention_percent ?? 5), sponsor_sub_passes: !!p.sponsor_sub_passes }); }, [p?.id]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await db.from("projects").update({ ...f, client_approval_threshold: Number(f.client_approval_threshold), default_retention_percent: Number(f.default_retention_percent) }).eq("id", PROJECT_ID);
    if (error) toast.error(error.message); else { toast.success("Settings saved"); refresh("projects"); }
  }
  return (
    <div>
      <PageTitle title="Project Settings & Team" sub={p ? `${p.project_number} · ${p.name}` : ""} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="space-y-3 rounded-md border bg-card p-4">
          <h2 className="font-display text-lg font-bold uppercase">Project details & rules</h2>
          <label className="block text-xs font-semibold">Project name<Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="block text-xs font-semibold">Client / Developer<Input value={f.employer_name} onChange={(e) => setF({ ...f, employer_name: e.target.value })} /></label>
          <label className="block text-xs font-semibold">Site address<Input value={f.site_address} onChange={(e) => setF({ ...f, site_address: e.target.value })} /></label>
          <label className="block text-xs font-semibold">Client approval limit (€)
            <Input type="number" value={f.client_approval_threshold} onChange={(e) => setF({ ...f, client_approval_threshold: e.target.value })} />
            <span className="font-normal text-muted-foreground">Extras up to {eur(Number(f.client_approval_threshold))} can be approved by the PM; above that the client must sign.</span>
          </label>
          <label className="block text-xs font-semibold">Default retention %<Input type="number" value={f.default_retention_percent} onChange={(e) => setF({ ...f, default_retention_percent: e.target.value })} /></label>
          <label className="flex items-center justify-between rounded border p-3 text-sm">
            <span><b>Sponsor subcontractor passes</b><br /><span className="text-xs text-muted-foreground">Trade crews use Sub Lite free — this project pays.</span></span>
            <Switch checked={f.sponsor_sub_passes} onCheckedChange={(v) => setF({ ...f, sponsor_sub_passes: v })} />
          </label>
          <Button type="submit">Save settings</Button>
        </form>
        <div className="space-y-3 rounded-md border bg-card p-4">
          <h2 className="font-display text-lg font-bold uppercase">Project team</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted-foreground"><th>User</th><th>Role</th><th>Since</th></tr></thead>
            <tbody>{(members.data ?? []).map((m) => <tr key={m.id} className="border-t"><td className="py-2 font-mono text-xs">{m.user_id.slice(0, 8)}…</td><td className="capitalize">{m.role}</td><td>{new Date(m.created_at).toLocaleDateString("en-GB")}</td></tr>)}</tbody>
          </table>
          <InviteMembers />
        </div>
      </div>
    </div>
  );
}

const TITLES = ["Outsourced Project Manager", "Architect / Perit", "Quantity Surveyor / Commercial", "Site Agent", "Safety Officer", "Client / Developer rep", "Viewer"];
function InviteMembers() {
  const invites = useTable("project_invites", { order: "created_at", asc: false });
  const refresh = useRefresh();
  const [v, setV] = useState({ email: "", full_name: "", job_title: TITLES[0]!, role: "member" });
  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const email = v.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error("Enter a valid email"); return; }
    const { error } = await db.from("project_invites").insert({ ...v, email, full_name: v.full_name.trim().slice(0, 100) });
    if (error) { toast.error(error.message.includes("row-level") ? "Only managers can invite" : error.message); return; }
    const link = `${window.location.origin}/auth`;
    try { await navigator.clipboard.writeText(link); } catch { /* clipboard optional */ }
    toast.success(`Invite saved. Sign-up link copied — send it to ${email}. They join when they sign in with that email.`);
    setV({ ...v, email: "", full_name: "" }); refresh("project_invites");
  }
  async function cancel(id: string) { const { error } = await db.from("project_invites").delete().eq("id", id); if (error) toast.error(error.message); else refresh("project_invites"); }
  return (
    <div className="space-y-2 border-t pt-3">
      <h3 className="text-sm font-bold uppercase">Invite a team member</h3>
      <form onSubmit={invite} className="grid gap-2 sm:grid-cols-2">
        <Input required type="email" placeholder="Email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        <Input placeholder="Full name" value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} />
        <select aria-label="Job title" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={v.job_title} onChange={(e) => setV({ ...v, job_title: e.target.value })}>{TITLES.map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="Permission" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })}><option value="member">Member (records only)</option><option value="manager">Manager (can approve & sign off)</option></select>
        <Button type="submit" className="sm:col-span-2">Send invite</Button>
      </form>
      <ul className="space-y-1 text-sm">{(invites.data ?? []).map((i) => (
        <li key={i.id} className="flex items-center justify-between rounded border px-2 py-1"><span>{i.full_name || i.email} <span className="text-xs text-muted-foreground">· {i.job_title} · {i.role} · {i.status}</span></span>{i.status === "Pending" && <Button size="sm" variant="ghost" onClick={() => cancel(i.id)}>Cancel</Button>}</li>
      ))}</ul>
    </div>
  );
}
