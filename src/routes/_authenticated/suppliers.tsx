import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { PageTitle } from "@/components/fb/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, useTable, useRefresh, eur } from "@/lib/db";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => pageHead("Suppliers & Incumbents", "Preferred supplier directory and the awarded contractor for every trade package."),
  component: Suppliers,
});

function Suppliers() {
  const sup = useTable("suppliers", { order: "company_name" });
  const pk = useTable("trade_packages", { order: "package_code" });
  const subs = useTable("subcontractors");
  const refresh = useRefresh();
  const [f, setF] = useState({ company_name: "", trade: "", contact_name: "", phone: "", email: "" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await db.from("suppliers").insert(f);
    if (error) toast.error(error.message); else { toast.success("Supplier added"); setF({ company_name: "", trade: "", contact_name: "", phone: "", email: "" }); refresh("suppliers"); }
  }
  return (
    <div className="space-y-6">
      <PageTitle title="Suppliers & Incumbents" sub="Who holds each package — extras on a package go to its incumbent first." />
      <section className="rounded-md border bg-card p-4">
        <h2 className="mb-2 font-display text-lg font-bold uppercase">Awarded packages</h2>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-muted-foreground"><th>Package</th><th>Value</th><th>Incumbent</th><th>Contact</th></tr></thead>
          <tbody>{(pk.data ?? []).map((p) => { const s = (subs.data ?? []).find((x) => x.package_id === p.id); return (
            <tr key={p.id} className="border-t"><td className="py-2"><span className="font-mono text-xs">{p.package_code}</span> {p.package_name}</td><td>{eur(p.subcontract_value)}</td><td className="font-semibold">{s?.company_name ?? <span className="text-muted-foreground">Not awarded</span>}</td><td className="text-xs">{s ? `${s.package_lead_name ?? ""} ${s.email ?? ""}` : ""}</td></tr>); })}</tbody></table>
      </section>
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-2 font-display text-lg font-bold uppercase">Preferred supplier directory</h2>
          <div className="grid gap-2 sm:grid-cols-2">{(sup.data ?? []).map((s) => (
            <div key={s.id} className="rounded border p-3 text-sm">
              <div className="font-semibold">{s.company_name}</div><div className="text-xs text-muted-foreground">{s.trade}</div>
              <div className="flex gap-0.5 py-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3 w-3 ${n <= s.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />)}</div>
              <div className="text-xs">{s.contact_name} · {s.phone}</div>{s.email && <a className="text-xs text-primary underline" href={`mailto:${s.email}`}>{s.email}</a>}
            </div>))}</div>
        </div>
        <form onSubmit={add} className="space-y-2 rounded-md border bg-card p-4">
          <h2 className="font-display text-lg font-bold uppercase">Add supplier</h2>
          <Input required placeholder="Company" value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} />
          <Input required placeholder="Trade" value={f.trade} onChange={(e) => setF({ ...f, trade: e.target.value })} />
          <Input placeholder="Contact name" value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} />
          <Input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Button type="submit" className="w-full">Add</Button>
        </form>
      </section>
    </div>
  );
}
