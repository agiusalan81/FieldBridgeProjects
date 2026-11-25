<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- FieldBridge data access goes through `src/lib/db.ts` (`useTable` + untyped `db` client) so screens stay simple; every app page lives under `src/routes/_authenticated/` and RLS allows only signed-in users, so add new pages there.
- Valuation and platform-fee maths live in `valuation()` in `src/lib/db.ts` (tested); UI only renders it, so fee rules have one source.
- Construction workflow rules (who may delete, numbering, inspection result, compliance expiry, sub-claim certificate) live in `src/lib/workflow.ts` (tested); records are deletable only by their creator while still open, otherwise resolved with photo evidence via `components/fb/Workflow.tsx`.
- The Live QA Hub (`/qa-hub`) is owner-only (RLS via `public.is_superadmin()`); its test cases live in `src/lib/qa-cases.ts` — add a case when adding a workflow.
- Project data access is limited to `public.project_members`; approvals/sign-offs (certify, approve, resolve, sign) are manager-only, enforced by the `enforce_manager_signoff` DB trigger, so UI buttons are convenience only.
- The active project lives in `PROJECT_ID` (live binding in `src/lib/db.ts`, persisted in localStorage; switching reloads); `useTable` auto-scopes project_id tables, so new project tables must be added to `PROJECT_SCOPED`.
- App navigation is grouped hubs in `AppShell.tsx` (`HUBS`), filtered by the selected workspace view; add new pages to a hub there.
- Sign-up survey answers are stored in auth metadata at sign-up and copied to `signup_profiles` (owner-only read, `/leads`) by `syncOnboarding` in AppShell after first sign-in, because no session exists before email confirmation; the same call runs `claim_invites()` to turn `project_invites` into memberships.
- Estimate rollups live in `src/lib/estimate.ts` (tested); payment certificates are printable views over `valuation()`, so no separate certificate data exists.
