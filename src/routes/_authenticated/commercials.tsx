import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageTitle } from "@/components/fb/AppShell";
import { StatusBadge } from "@/components/fb/StatusBadge";
import { Button } from "@/components/ui/button";
import { db, PROJECT_ID, useTable, useRefresh, eur, finalAccount } from "@/lib/db";
import { pageHead } from "@/lib/head";
import { AddonNudge } from "@/components/fb/Addons";
import { PaymentApplications } from "@/components/fb/PaymentApplications";

export const Route = createFileRoute("/_authenticated/commercials")({
  head: () => pageHead("Commercials & Variations", "Contract sum, approved variations, anticipated final account and extension of time tracking."),
  component: Commercials,
});

function Commercials() {
  const p = useTable("projects").data?.find((x) => x.id === PROJECT_ID);
  const vars = useTable("variations", { order: "variation_number" });
  const pkgs = useTable("trade_packages", { order: "package_code" });
  const refresh = useRefresh();
  const v = vars.data ?? [];
  const fa = finalAccount(p?.original_contract_sum ?? 0, v);
  const pending = v.filter((x) => x.status.startsWith("Submitted")).reduce((s, x) => s + Number(x.claimed_contractor_amount), 0);

  async function decide(id: string, row: { claimed_contractor_amount: number; eot_days_claimed: number }, approve: boolean) {
    const { error } = await db.from("variations").update(approve ? { status: "Approved", approved_employer_amount: row.claimed_contractor_amount, eot_days_granted: row.eot_days_claimed } : { status: "Rejected" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Variation approved" : "Variation rejected"); refresh("variations");
  }

  return (
    <>
      <PageTitle title="Commercials, Variations & Valuations" sub="QS / Commercial Manager view" />
      <div className="mb-6 flex flex-wrap items-stretch gap-2 font-display">
        {[["Original Contract Sum", eur(p?.original_contract_sum)], ["+ Approved Variations", eur(fa.approved)], ["= Anticipated Final Account", eur(fa.total)]].map(([l, val], i) => (
          <div key={l} className={`min-w-[220px] flex-1 rounded-md border p-4 ${i === 2 ? "border-primary bg-shell text-shell-foreground" : "bg-card"}`}>
            <div className="font-sans text-xs font-semibold uppercase tracking-wide opacity-70">{l}</div><div className="text-3xl font-bold">{val}</div>
          </div>
        ))}
        <div className="min-w-[220px] flex-1 rounded-md border bg-card p-4"><div className="font-sans text-xs font-semibold uppercase tracking-wide opacity-70">Pending with Employer</div><div className="text-3xl font-bold text-info">{eur(pending)}</div></div>
      </div>
      <h2 className="mb-2 font-display text-xl font-bold uppercase">Variations Register</h2>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-shell text-left text-xs uppercase tracking-wide text-shell-foreground">
            <tr><th className="p-3">VO</th><th>Title / Source</th><th className="text-right">Subcon quote</th><th className="text-right">Claimed</th><th className="text-right">Employer valuation</th><th className="text-right">Margin</th><th className="text-center">EOT claimed / granted</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {v.map((x) => (
              <tr key={x.id} className="border-t align-top">
                <td className="p-3 font-mono font-bold">{x.variation_number}</td>
                <td className="py-3"><div className="font-medium">{x.title}</div><div className="text-xs text-muted-foreground">{x.instruction_source} · {x.scope_description}</div>{x.source_type && <div className="text-[11px] font-semibold uppercase text-primary">From {x.source_type === "rfi" ? "RFI" : "daywork sheet"}</div>}</td>
                <td className="py-3 text-right font-mono">{eur(x.subcontractor_quotation)}</td>
                <td className="py-3 text-right font-mono">{eur(x.claimed_contractor_amount)}</td>
                <td className="py-3 text-right font-mono">{eur(x.approved_employer_amount)}</td>
                <td className="py-3 text-right font-mono text-success">{x.approved_employer_amount ? eur(x.approved_employer_amount - x.subcontractor_quotation) : "—"}</td>
                <td className="py-3 text-center font-mono">{x.eot_days_claimed}d / {x.eot_days_granted}d</td>
                <td className="py-3"><StatusBadge value={x.status} /></td>
                <td className="py-3 pr-3">{x.status === "Potential" && <Button size="sm" variant="outline" onClick={async () => { const { error } = await db.from("variations").update({ status: "Submitted" }).eq("id", x.id); if (error) toast.error(error.message); else { toast.success("Submitted to client for approval"); refresh("variations"); } }}>Price & submit</Button>}{x.status.startsWith("Submitted") && <div className="flex gap-1"><Button size="sm" onClick={() => decide(x.id, x, true)}>Approve</Button><Button size="sm" variant="outline" onClick={() => decide(x.id, x, false)}>Reject</Button></div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddonNudge k="books" reason="Certified valuations here can become VAT invoices in Books automatically, with retention tracked." />
      <PaymentApplications projectId={p?.id} />
      <AddonNudge k="mail" reason="Send payment certificates and Pay Less notices with delivery receipts as contractual evidence." />
      <h2 className="mb-2 mt-6 font-display text-xl font-bold uppercase">Trade Package Subcontract Values</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {pkgs.data?.map((k) => <div key={k.id} className="rounded-md border bg-card p-3"><div className="font-mono text-xs text-muted-foreground">{k.package_code}</div><div className="font-medium">{k.package_name}</div><div className="font-display text-xl font-bold">{eur(k.subcontract_value)}</div></div>)}
      </div>
    </>
  );
}
