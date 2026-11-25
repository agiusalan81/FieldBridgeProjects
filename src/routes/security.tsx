import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/fb/LegalPage";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/security")({
  head: () => pageHead("Security", "How FieldBridge Projects protects project records, sign-offs and site photos."),
  component: () => (
    <LegalPage title="Security" updated="25 November 2026">
      <section><h2>Access control</h2><ul><li>Every project is private to its members; access is checked on the server for every request.</li><li>Approvals and sign-offs are limited to project managers and enforced by the database, not just the screen.</li><li>Records can only be deleted by their creator while still open; afterwards they are resolved with evidence and kept.</li></ul></section>
      <section><h2>Data protection</h2><ul><li>All traffic is encrypted in transit.</li><li>Photos and drawings are kept in private storage.</li><li>Remote sign-off links are single-purpose and expire.</li></ul></section>
      <section><h2>Offline use</h2><p>Records captured without signal are kept on your device, separated per user and project, and checked again by the server when they upload. Sign-offs are never queued offline.</p></section>
      <section><h2>Report a problem</h2><p>Found a security issue? Email <a href="mailto:security@fieldbridgeapp.com">security@fieldbridgeapp.com</a>.</p></section>
    </LegalPage>
  ),
});
