import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, ClipboardList, HelpCircle, Bug, Receipt, FileSignature, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BetaBadge, LegalLinks } from "@/components/fb/Beta";
import icon from "@/assets/icon-fieldbridge-projects.jpg";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "FieldBridge Projects — Construction project management" },
      { name: "description", content: "Drawings, RFIs, snags, daily returns, dayworks and valuations for contractors and subcontractors, in one site-ready app." },
      { property: "og:title", content: "FieldBridge Projects — Run every site from one place" },
      { property: "og:description", content: "Drawings, RFIs, snags, daily returns and valuations for main contractors and subcontractors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Layers, t: "Live drawings", d: "Latest revisions with pinned snags and RFIs, on any phone." },
  { icon: ClipboardList, t: "Daily returns", d: "Headcount, plant and delays logged from site in a minute." },
  { icon: HelpCircle, t: "RFIs", d: "Questions, deadlines and answers with a full trail." },
  { icon: Bug, t: "Snagging", d: "Photo-proof rectification, assigned by trade." },
  { icon: FileSignature, t: "Dayworks", d: "Signed on screen, on site, the same day." },
  { icon: Receipt, t: "Valuations", d: "Applications for payment with retention, ready for FieldBridge Books." },
];

const plans = [
  { n: "Sub Lite", p: "€19", d: "For subcontractors", f: ["Daily returns", "My trade snags", "Drawings for your package", "Payment claims"] },
  { n: "Project Pro", p: "€299", d: "For main contractors", f: ["Everything in Sub Lite", "Unlimited users on site", "Valuations & variations", "Dayworks sign-off"], hi: true },
  { n: "Enterprise", p: "Talk to us", d: "Multi-site portfolios", f: ["Multiple projects", "Custom branding", "Books & Mail included", "Priority support"] },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-primary bg-shell text-shell-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={icon} alt="FieldBridge Projects logo" width={32} height={32} className="h-8 w-8 rounded-sm" />
            <span className="font-display text-xl font-bold uppercase tracking-wide">FieldBridge <span className="text-primary">Projects</span></span>
            <BetaBadge />
          </div>
          <Button asChild size="sm"><Link to="/auth" search={{ redirect: "/" }}>Sign in</Link></Button>
        </div>
      </header>
      <section className="bg-shell text-shell-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="font-mono text-sm text-primary">BUILT FOR SITE, NOT THE OFFICE</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold uppercase leading-none md:text-7xl">Run every site from one place.</h1>
          <p className="mt-6 max-w-xl text-lg text-shell-muted">Drawings, RFIs, snags, daily returns and valuations for main contractors and their subcontractors.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth" search={{ redirect: "/" }}>Start free trial</Link></Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="rounded-md border-l-4 border-primary bg-card p-5">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-display text-xl font-bold uppercase">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
      <section className="bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-4xl font-bold uppercase">Plans</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.n} className={`rounded-md bg-card p-6 ${p.hi ? "border-t-4 border-primary" : "border-t-4 border-border"}`}>
                <h3 className="font-display text-2xl font-bold uppercase">{p.n}</h3>
                <p className="text-sm text-muted-foreground">{p.d}</p>
                <p className="mt-4 font-display text-4xl font-bold">{p.p}{p.p.startsWith("€") && <span className="text-base font-normal text-muted-foreground">/month</span>}</p>
                <ul className="mt-4 space-y-2 text-sm">{p.f.map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 text-primary" />{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="bg-shell py-8 text-center text-sm text-shell-muted"><LegalLinks className="mb-3" />© 2026 FieldBridge Projects · fieldbridgeprojects.com</footer>
    </div>
  );
}
