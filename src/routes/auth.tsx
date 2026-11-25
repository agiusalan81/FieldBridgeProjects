import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import icon from "@/assets/icon-fieldbridge-projects.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/head";
import { ORG_TYPES, JOB_ROLES, TEAM_SIZES, PROBLEMS, stepOne } from "@/lib/signup";

const safe = (r: unknown) => (typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : "/");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: safe(s["redirect"]) }),
  head: () => pageHead("Sign in or create account", "Sign in or create your FieldBridge Projects account to manage drawings, RFIs, snags and valuations."),
  component: Auth,
});

const sel = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

function Auth() {
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ first_name: "", last_name: "", company_name: "", email: "", phone: "", password: "" });
  const [s, setS] = useState({ organisation_type: "", job_role: "", team_size: "", reason: "", problems: [] as string[] });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    nav({ to: redirect });
  }
  function next(e: React.FormEvent) {
    e.preventDefault();
    const r = stepOne.safeParse(f);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Check the form"); return; }
    setStep(2);
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!s.organisation_type || !s.job_role) { toast.error("Pick your field of work and role"); return; }
    setBusy(true);
    const { password, ...info } = f;
    const { data, error } = await supabase.auth.signUp({ email: info.email.trim(), password, options: { emailRedirectTo: window.location.origin, data: { ...info, ...s, reason: s.reason.slice(0, 500) } } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) { toast.success("Check your email to confirm your account"); setMode("in"); setStep(1); return; }
    nav({ to: redirect });
  }
  const toggle = (p: string) => setS({ ...s, problems: s.problems.includes(p) ? s.problems.filter((x) => x !== p) : [...s.problems, p] });

  return (
    <div className="flex min-h-screen items-center justify-center bg-shell p-4">
      <div className="w-full max-w-md space-y-3 rounded-md border-t-4 border-primary bg-card p-6">
        <div className="flex items-center gap-2"><img src={icon} alt="FieldBridge Projects logo" width={28} height={28} className="h-7 w-7 rounded-sm" /><span className="font-display text-2xl font-bold uppercase">FieldBridge Projects</span></div>
        {mode === "in" ? (
          <form onSubmit={signIn} className="space-y-3">
            <p className="text-sm text-muted-foreground">Sign in to your project</p>
            <Input type="email" required placeholder="Email" aria-label="Email" value={f.email} onChange={set("email")} />
            <Input type="password" required placeholder="Password" aria-label="Password" value={f.password} onChange={set("password")} />
            <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
          </form>
        ) : step === 1 ? (
          <form onSubmit={next} className="space-y-3">
            <p className="text-sm text-muted-foreground">Create your account · Step 1 of 2</p>
            <div className="grid grid-cols-2 gap-2">
              <Input required placeholder="First name" aria-label="First name" value={f.first_name} onChange={set("first_name")} />
              <Input required placeholder="Surname" aria-label="Surname" value={f.last_name} onChange={set("last_name")} />
            </div>
            <Input required placeholder="Company name" aria-label="Company name" value={f.company_name} onChange={set("company_name")} />
            <Input type="email" required placeholder="Work email" aria-label="Work email" value={f.email} onChange={set("email")} />
            <Input type="tel" placeholder="Mobile / WhatsApp (optional)" aria-label="Mobile" value={f.phone} onChange={set("phone")} />
            <Input type="password" required minLength={8} placeholder="Password (8+ characters)" aria-label="Password" value={f.password} onChange={set("password")} />
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        ) : (
          <form onSubmit={signUp} className="space-y-3">
            <p className="text-sm text-muted-foreground">Tell us about your work · Step 2 of 2</p>
            <label className="block text-xs font-semibold">Field of work
              <select className={sel} value={s.organisation_type} onChange={(e) => setS({ ...s, organisation_type: e.target.value })}><option value="">Choose…</option>{ORG_TYPES.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="block text-xs font-semibold">Your role
              <select className={sel} value={s.job_role} onChange={(e) => setS({ ...s, job_role: e.target.value })}><option value="">Choose…</option>{JOB_ROLES.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="block text-xs font-semibold">Size of operation
              <select className={sel} value={s.team_size} onChange={(e) => setS({ ...s, team_size: e.target.value })}><option value="">Choose…</option>{TEAM_SIZES.map((o) => <option key={o}>{o}</option>)}</select></label>
            <fieldset className="space-y-1 text-sm"><legend className="text-xs font-semibold">What problems do you need solved?</legend>
              {PROBLEMS.map((p) => <label key={p} className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={s.problems.includes(p)} onChange={() => toggle(p)} />{p}</label>)}
            </fieldset>
            <label className="block text-xs font-semibold">Why are you trying FieldBridge? (optional)
              <Textarea maxLength={500} value={s.reason} onChange={(e) => setS({ ...s, reason: e.target.value })} /></label>
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button><Button type="submit" className="flex-1" disabled={busy}>Create account</Button></div>
          </form>
        )}
        <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setStep(1); }}>
          {mode === "in" ? "No account yet? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
