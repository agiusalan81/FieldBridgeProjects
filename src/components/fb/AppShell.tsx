import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import icon from "@/assets/icon-fieldbridge-projects.jpg";
import { LayoutDashboard, Layers, ClipboardList, HelpCircle, Bug, Receipt, Plus, Wifi, WifiOff, Puzzle, FileSignature, LogOut, FileCheck2, ListChecks, Users, ClipboardCheck, Settings, Truck, Smartphone, ChevronDown, Menu, X, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuickCreate } from "./QuickCreate";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "./Workflow";
import { db, PROJECT_ID, setActiveProject, useTable } from "@/lib/db";
import { initializeAccountAccess } from "@/lib/account-access";

type Item = { to: string; label: string; icon: typeof Layers };
const HUBS: { hub: string; roles: string[]; items: Item[] }[] = [
  { hub: "Overview", roles: ["all"], items: [{ to: "/", label: "Control Centre", icon: LayoutDashboard }] },
  { hub: "Site Operations", roles: ["Project Director", "Site Agent", "Lead Consultant"], items: [
    { to: "/drawings", label: "Drawings & Pins", icon: Layers },
    { to: "/returns", label: "Daily Returns", icon: ClipboardList },
    { to: "/snags", label: "Snagging", icon: Bug },
  ] },
  { hub: "Technical & Quality", roles: ["Project Director", "Site Agent", "Lead Consultant"], items: [
    { to: "/rfis", label: "RFIs", icon: HelpCircle },
    { to: "/submittals", label: "Submittals", icon: FileCheck2 },
    { to: "/inspections", label: "Inspections", icon: ListChecks },
  ] },
  { hub: "Commercials", roles: ["Project Director", "Client / Developer"], items: [
    { to: "/commercials", label: "Variations & Valuations", icon: Receipt },
    { to: "/estimate", label: "Estimate & Budget", icon: Calculator },
    { to: "/daywork", label: "Dayworks", icon: FileSignature },
    { to: "/sub-portal", label: "Sub Claims & Compliance", icon: Users },
  ] },
  { hub: "Directory & Procurement", roles: ["Project Director"], items: [
    { to: "/suppliers", label: "Suppliers & Incumbents", icon: Truck },
    { to: "/sub", label: "Sub Lite (mobile)", icon: Smartphone },
  ] },
  { hub: "Company & Settings", roles: ["Project Director"], items: [
    { to: "/settings", label: "Project Settings & Team", icon: Settings },
    { to: "/addons", label: "Add-ons", icon: Puzzle },
  ] },
];

export const ROLES = ["Project Director", "Site Agent", "Lead Consultant", "Client / Developer", "Subcontractor Lead"];
const visible = (role: string) => HUBS.filter((h) => h.roles.includes("all") || h.roles.includes(role) || (role === "Subcontractor Lead" && h.hub === "Directory & Procurement"))
  .map((h) => role === "Subcontractor Lead" ? { ...h, items: h.items.filter((i) => i.to === "/" || i.to === "/sub") } : h)
  .filter((h) => h.items.length);

export function AppShell({ children }: { children: ReactNode }) {
  const [role, setRole] = useState("Project Director");
  const [online, setOnline] = useState(true);
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const queryClient = useQueryClient();
  const [accessReady, setAccessReady] = useState(false);
  const [accessError, setAccessError] = useState<string>();
  const [accessAttempt, setAccessAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setAccessError(undefined);
    void (async () => {
      try {
        await syncOnboarding();
        await queryClient.invalidateQueries();
        if (!cancelled) setAccessReady(true);
      } catch {
        if (!cancelled) setAccessError("We couldn't confirm your project access. Please try again.");
      }
    })();
    return () => { cancelled = true; };
  }, [queryClient, accessAttempt]);
  const [newProject, setNewProject] = useState(false);
  const me = useMe();
  const projects = useTable("projects", { order: "project_number" });
  useEffect(() => {
    const saved = localStorage.getItem("fbp.role"); if (saved && ROLES.includes(saved)) setRole(saved);
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => { window.removeEventListener("online", u); window.removeEventListener("offline", u); };
  }, []);
  const hubs = visible(role);
  const nav = <SideNav hubs={hubs} onPick={() => setDrawer(false)} />;

  if (!accessReady) return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="space-y-3 text-center">
        <p role="status" className="text-sm text-muted-foreground">{accessError ?? "Opening your project…"}</p>
        {accessError && <Button onClick={() => setAccessAttempt((attempt) => attempt + 1)}>Try again</Button>}
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b-4 border-primary bg-shell text-shell-foreground">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" onClick={() => setDrawer(true)}><Menu className="h-5 w-5" /></Button>
          <Link to="/" className="flex items-center gap-2">
            <img src={icon} alt="FieldBridge Projects logo" width={28} height={28} className="h-7 w-7 rounded-sm" />
            <span className="font-display text-xl font-bold uppercase tracking-wide">FieldBridge <span className="text-primary">Projects</span></span>
          </Link>
          <Select value={PROJECT_ID} onValueChange={(v) => v === "__new" ? setNewProject(true) : setActiveProject(v)}>
            <SelectTrigger aria-label="Active project" className="h-9 max-w-[300px] border-sidebar-border bg-sidebar-accent text-shell-foreground"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {(projects.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.project_number} · {p.name}</SelectItem>)}
              <SelectItem value="__new">+ New project</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <span className={`hidden items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold uppercase sm:flex ${online ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
              {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}{online ? "Online" : "Offline"}
            </span>
            <Select value={role} onValueChange={(r) => { setRole(r); localStorage.setItem("fbp.role", r); }}>
              <SelectTrigger aria-label="Workspace view" className="h-9 w-[170px] border-sidebar-border bg-sidebar-accent text-shell-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => setOpen(true)} className="h-9 font-semibold" aria-label="Quick create"><Plus className="h-4 w-4" /><span className="hidden sm:inline">New</span></Button>
            {me.isOwner && <Link to="/qa-hub" aria-label="Live QA Hub" className="rounded p-2 text-primary hover:bg-sidebar-accent"><ClipboardCheck className="h-4 w-4" /></Link>}
            {me.isOwner && <Link to="/leads" aria-label="Sign-up leads" className="rounded p-2 text-primary hover:bg-sidebar-accent"><Users className="h-4 w-4" /></Link>}
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-60 shrink-0 overflow-y-auto border-r bg-shell text-shell-foreground md:block">{nav}</aside>
        <main className="mx-auto w-full max-w-[1500px] p-4 md:p-6">{children}</main>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-shell text-shell-foreground">
            <div className="flex justify-end p-2"><Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setDrawer(false)}><X className="h-5 w-5" /></Button></div>
            {nav}
          </aside>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-primary bg-shell md:hidden">
        {hubs.flatMap((h) => h.items).slice(0, 5).map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
            className="flex min-w-[64px] flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] text-shell-muted"
            activeProps={{ className: "!text-primary" }}>
            <n.icon className="h-5 w-5" />{n.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
      <QuickCreate open={open} onOpenChange={setOpen} />
      <NewProject open={newProject} onOpenChange={setNewProject} />
    </div>
  );
}

function SideNav({ hubs, onPick }: { hubs: { hub: string; items: Item[] }[]; onPick: () => void }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  return (
    <nav className="space-y-1 p-2">
      {hubs.map((h) => (
        <div key={h.hub}>
          <button className="flex w-full items-center justify-between px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-shell-muted" onClick={() => setClosed((c) => ({ ...c, [h.hub]: !c[h.hub] }))}>
            {h.hub}<ChevronDown className={`h-3 w-3 transition ${closed[h.hub] ? "-rotate-90" : ""}`} />
          </button>
          {!closed[h.hub] && h.items.map((n) => (
            <Link key={n.to} to={n.to} onClick={onPick} activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-2 rounded-sm border-l-2 border-transparent px-3 py-2 text-sm text-shell-muted hover:bg-sidebar-accent hover:text-shell-foreground"
              activeProps={{ className: "!border-primary !bg-sidebar-accent !text-shell-foreground" }}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

function NewProject({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [f, setF] = useState({ project_number: "", name: "", employer_name: "", site_address: "", original_contract_sum: "", possession_date: "", practical_completion_date: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data, error } = await db.from("projects").insert({
      project_number: f.project_number, name: f.name, employer_name: f.employer_name || null, site_address: f.site_address || null,
      original_contract_sum: Number(f.original_contract_sum || 0), currency: "EUR", status: "Active",
      possession_date: f.possession_date || null, practical_completion_date: f.practical_completion_date || null,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project created"); setActiveProject(data.id);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input required placeholder="Project code (e.g. PRJ-2026-02)" value={f.project_number} onChange={set("project_number")} />
            <Input required placeholder="Contract sum €" type="number" value={f.original_contract_sum} onChange={set("original_contract_sum")} />
          </div>
          <Input required placeholder="Project name" value={f.name} onChange={set("name")} />
          <Input placeholder="Client / Developer" value={f.employer_name} onChange={set("employer_name")} />
          <Input placeholder="Site address" value={f.site_address} onChange={set("site_address")} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">Site possession<Input type="date" value={f.possession_date} onChange={set("possession_date")} /></label>
            <label className="text-xs">Practical completion<Input type="date" value={f.practical_completion_date} onChange={set("practical_completion_date")} /></label>
          </div>
          <p className="text-xs text-muted-foreground">Only project managers can create projects. Add levels, packages and drawings after creating.</p>
          <Button type="submit" disabled={busy}>Create project</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/** After sign-in: save the sign-up survey (kept in account metadata until confirmed) and accept pending team invites. */
async function syncOnboarding() {
  const { data, error } = await supabase.auth.getUser();
  const u = data.user;
  if (error || !u) throw new Error("Sign in to confirm account access");
  const n = await initializeAccountAccess(db);
  const m = (u.user_metadata ?? {}) as Record<string, unknown>;
  if (m["first_name"]) {
    await db.from("signup_profiles").upsert({ user_id: u.id, email: u.email, first_name: m["first_name"], last_name: m["last_name"] ?? "", company_name: m["company_name"] ?? "", phone: m["phone"] ?? null, organisation_type: m["organisation_type"] ?? null, job_role: m["job_role"] ?? null, team_size: m["team_size"] ?? null, problems: m["problems"] ?? [], reason: m["reason"] ?? null }, { onConflict: "user_id", ignoreDuplicates: true });
  }
  if (n > 0) toast.success("Your project access is ready");
}
