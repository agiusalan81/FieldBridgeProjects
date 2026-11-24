import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/fb/AppShell";
import { AddonCard } from "@/components/fb/Addons";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/addons")({
  head: () => pageHead("Add-ons: Books & Mail", "Connect FieldBridge Books for automatic invoicing and FieldBridge Mail for audited project correspondence."),
  component: Addons,
});

function Addons() {
  return (
    <>
      <PageTitle title="Add-ons" sub="Native FieldBridge modules — no third-party tools, no re-keying" />
      <div className="mb-5 rounded-md bg-shell p-4 text-shell-foreground">
        <div className="font-display text-xl font-bold uppercase">Certify → Invoice → Send, in one click</div>
        <p className="text-sm text-shell-muted">With both add-ons, a certified valuation becomes a Books invoice and is emailed to the employer through Mail with a delivery receipt — the full paper trail, without leaving the project.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2"><AddonCard k="books" /><AddonCard k="mail" /></div>
    </>
  );
}
