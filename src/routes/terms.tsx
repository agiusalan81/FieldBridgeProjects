import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/fb/LegalPage";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("Terms of Service", "The terms for using FieldBridge Projects, including the beta evaluation, subscriptions and responsibilities on site."),
  component: () => (
    <LegalPage title="Terms of Service" updated="25 November 2026">
      <section><h2>Who we are</h2><p>FieldBridge Projects is part of the FieldBridge family of products. By creating an account or using the app you agree to these terms.</p></section>
      <section><h2>Beta evaluation</h2><p>The app is currently in beta. Features may change, be paused or be removed, and occasional errors may occur. We will give reasonable notice of significant changes.</p></section>
      <section><h2>Your responsibilities on site</h2><ul><li>FieldBridge Projects helps you record drawings, RFIs, snags, inspections, dayworks and valuations. It does not replace professional, engineering, safety or contractual judgement.</li><li>You are responsible for the accuracy of the information, photos and signatures you record.</li><li>Keep sign-in details private. Sign-offs made from your account are treated as yours.</li></ul></section>
      <section><h2>Your data</h2><p>Your project records belong to you and your organisation. Members you invite to a project can see that project's records according to their role.</p></section>
      <section><h2>Subscriptions</h2><p>Paid plans renew each billing period until cancelled. Cancelling stops the next renewal; you keep access until the end of the paid period. Invoices are issued through FieldBridge Books.</p></section>
      <section><h2>Acceptable use</h2><p>Do not misuse the service, attempt to access other organisations' projects, or upload unlawful content.</p></section>
      <section><h2>Liability</h2><p>To the extent permitted by law, the service is provided as is during the beta and we are not liable for indirect or consequential losses, including delay or contractual claims.</p></section>
      <section><h2>Contact</h2><p>Questions about these terms: <a href="mailto:legal@fieldbridgeapp.com">legal@fieldbridgeapp.com</a>.</p></section>
    </LegalPage>
  ),
});
