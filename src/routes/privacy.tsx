import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/fb/LegalPage";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("Privacy Policy", "How FieldBridge Projects handles account details, site photos, signatures and project records."),
  component: () => (
    <LegalPage title="Privacy Policy" updated="25 November 2026">
      <section><h2>What we collect</h2><ul><li>Account details: name, email, company, phone (optional) and the sign-up survey answers you give.</li><li>Project records you create: drawings, pins, RFIs, snags, inspections, daily returns, dayworks, valuations and signatures.</li><li>Site photos you take or upload. Camera access is only used when you choose to add a photo.</li></ul></section>
      <section><h2>How we use it</h2><p>To run your projects, show records to the team members you invite, send account emails, and improve the app. We do not sell your data.</p></section>
      <section><h2>Who can see your records</h2><p>Only members of a project can see its records. Remote sign-off links give a signer access to the single item they are asked to sign until the link expires.</p></section>
      <section><h2>Stored on your device</h2><p>To keep you signed in and let the app work without signal on site, it stores your session, recently opened project data and records waiting to upload in your browser. These are cleared when you sign out.</p></section>
      <section><h2>Visitor analytics</h2><p>On our published site we use Lovable's visitor analytics. It uses no cookies, stores nothing on your device, doesn't keep IP addresses and doesn't identify visitors. Lovable collects this data for us. <a href="https://lovable.dev/privacy">Lovable's privacy policy</a> explains how it handles it.</p><p>It records the pages visited, where visitors came from, their country, browser, operating system and device type, how long they stay, how fast pages load, errors, and which buttons and links are clicked. This is recorded for every visitor. Detailed data is kept for 90 days and daily summaries for a year.</p></section>
      <section><h2>Service providers</h2><p>Our hosting and database provider stores your account and project records and photos on our behalf. Fonts are loaded from Google Fonts, which receives your browser's request.</p></section>
      <section><h2>Retention and your rights</h2><p>Project records and their audit history are kept while the project account is active so that closed items remain available as evidence. You can ask to access, correct or delete your personal data at <a href="mailto:privacy@fieldbridgeapp.com">privacy@fieldbridgeapp.com</a>.</p></section>
    </LegalPage>
  ),
});
