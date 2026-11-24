import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import icon from "@/assets/icon-fieldbridge-projects.jpg";
import { HardHat, LayoutDashboard, Layers, ClipboardList, HelpCircle, Bug, Receipt, Plus, Wifi, WifiOff, Puzzle, FileSignature, LogOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { QuickCreate } from "./QuickCreate";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Control Centre", icon: LayoutDashboard },
  { to: "/drawings", label: "Drawings", icon: Layers },
  { to: "/returns", label: "Daily Returns", icon: ClipboardList },
  { to: "/rfis", label: "RFIs", icon: HelpCircle },
  { to: "/snags", label: "Snagging", icon: Bug },
  { to: "/commercials", label: "Commercials", icon: Receipt },
  { to: "/daywork", label: "Dayworks", icon: FileSignature },
  { to: "/addons", label: "Add-ons", icon: Puzzle, FileSignature, LogOut },
] as const;

export const ROLES = ["Project Director", "Site Agent", "Subcontractor Lead", "Lead Consultant"];

export function AppShell({ children }: { children: ReactNode }) {
  const [role, setRole] = useState(ROLES[0]!);
  const [online, setOnline] = useState(true);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => { window.removeEventListener("online", u); window.removeEventListener("offline", u); };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b-4 border-primary bg-shell text-shell-foreground">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <img src={icon} alt="FieldBridge Projects logo" width={28} height={28} className="h-7 w-7 rounded-sm" />
            <span className="font-display text-xl font-bold uppercase tracking-wide">FieldBridge <span className="text-primary">Projects</span></span>
          </Link>
          <div className="hidden items-center gap-2 rounded-sm bg-sidebar-accent px-3 py-1.5 text-xs lg:flex">
            <span className="font-mono text-primary">PRJ-2026-01</span>
            <span className="text-shell-muted">St. Michael's Commercial Complex & Residences</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`hidden items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold uppercase sm:flex ${online ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
              {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}{online ? "Online" : "Offline"}
            </span>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger aria-label="Role" className="h-9 w-[170px] border-sidebar-border bg-sidebar-accent text-shell-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => setOpen(true)} className="h-9 font-semibold"><Plus className="h-4 w-4" /><span className="hidden sm:inline">New Notice / RFI / Snag</span></Button>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
        <nav className="hidden gap-1 px-3 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm text-shell-muted hover:text-shell-foreground"
              activeProps={{ className: "!border-primary !text-shell-foreground" }}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1500px] p-4 md:p-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-8 border-t-2 border-primary bg-shell md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
            className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] text-shell-muted"
            activeProps={{ className: "!text-primary" }}>
            <n.icon className="h-5 w-5" />{n.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
      <QuickCreate open={open} onOpenChange={setOpen} />
    </div>
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
