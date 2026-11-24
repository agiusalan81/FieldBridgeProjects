import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/head";

const safe = (r: unknown) => (typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : "/");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: safe(s["redirect"]) }),
  head: () => pageHead("Sign in", "Sign in to FieldBridge Projects to manage drawings, RFIs, snags and valuations."),
  component: Auth,
});

function Auth() {
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) { toast.success("Check your email to confirm your account"); return; }
    nav({ to: redirect });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-shell p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-md border-t-4 border-primary bg-card p-6">
        <div className="flex items-center gap-2"><HardHat className="h-7 w-7 text-primary" /><span className="font-display text-2xl font-bold uppercase">FieldBridge Projects</span></div>
        <p className="text-sm text-muted-foreground">{mode === "in" ? "Sign in to your project" : "Create your account"}</p>
        <Input type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required minLength={8} placeholder="Password" aria-label="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
        <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "No account yet? Create one" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
