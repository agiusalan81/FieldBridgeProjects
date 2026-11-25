import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/fb/LegalPage";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/accessibility")({
  head: () => pageHead("Accessibility", "Our commitment to making FieldBridge Projects usable for everyone on site and in the office."),
  component: () => (
    <LegalPage title="Accessibility" updated="25 November 2026">
      <section><h2>Our aim</h2><p>We want FieldBridge Projects to work for everyone, on phones in bright sunlight and on office screens, aiming for WCAG 2.2 AA.</p></section>
      <section><h2>What we do</h2><ul><li>High-contrast colours and large touch targets for gloved hands.</li><li>Labelled controls for screen readers and keyboard navigation.</li><li>Layouts that fit phone screens without sideways scrolling.</li></ul></section>
      <section><h2>Known limits</h2><p>Drawing sheets and signatures rely on visual and touch input. Every pinned item is also listed in the registers as text.</p></section>
      <section><h2>Tell us</h2><p>If something is hard to use, email <a href="mailto:accessibility@fieldbridgeapp.com">accessibility@fieldbridgeapp.com</a>.</p></section>
    </LegalPage>
  ),
});
