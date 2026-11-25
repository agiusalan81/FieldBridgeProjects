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
          <p className="text-xs text-muted-foreground">Inviting members by email is queued with Google sign-in (next step on the roadmap).</p>
        </div>
      </div>
    </div>
  );
}
