import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/fb/AppShell";
import { useMe } from "@/components/fb/Workflow";
import { useTable } from "@/lib/db";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => pageHead("Sign-up Leads", "Owner-only list of new sign-ups with their survey answers."),
  component: Leads,
});

function Leads() {
  const me = useMe();
  const rows = useTable("signup_profiles", { order: "created_at", asc: false }).data ?? [];
  if (!me.isOwner) return <p className="p-6 text-sm">Owner only.</p>;
  return (
    <div>
      <PageTitle title="Sign-up Leads" sub={`${rows.length} accounts · newest first`} />
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-shell text-left text-xs uppercase text-shell-foreground"><tr><th className="p-3">Name</th><th>Company</th><th>Contact</th><th>Field / Role</th><th>Size</th><th>Problems & reason</th><th>Joined</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.user_id} className="border-t align-top">
              <td className="p-3 font-semibold">{r.first_name} {r.last_name}</td><td>{r.company_name}</td>
              <td className="text-xs"><a className="underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <div>{r.phone}</div>}</td>
              <td className="text-xs">{r.organisation_type}<div className="text-muted-foreground">{r.job_role}</div></td>
              <td className="text-xs">{r.team_size}</td>
              <td className="text-xs">{(r.problems ?? []).join(" · ")}{r.reason && <div className="italic text-muted-foreground">“{r.reason}”</div>}</td>
              <td className="text-xs">{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
