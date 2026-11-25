import { describe, expect, it } from "vitest";
import { refusesOfflineWorker } from "./pwa";

describe("offline worker registration guard", () => {
  it.each(["id-preview--452db569.lovable.app", "preview-v2--shop.lovable.app", "preview--shop.gpt-eng.com", "project--452db569-4c2a-456b-aee7-17dd29230072-dev.gptengineer.run", "452db569.lovableproject.com", "shop.lovableproject-dev.com", "beta.lovable.dev"])("refuses preview %s even in a production build", (host) => {
    expect(refusesOfflineWorker(host, true, false, "")).toBe(true);
  });
  it("refuses development, frames and the explicit kill switch", () => {
    expect(refusesOfflineWorker("fieldbridgeprojects.com", false, false, "")).toBe(true);
    expect(refusesOfflineWorker("fieldbridgeprojects.com", true, true, "")).toBe(true);
    expect(refusesOfflineWorker("fieldbridgeprojects.com", true, false, "?sw=off")).toBe(true);
  });
  it("allows published and custom domains, including preview-looking custom labels", () => {
    expect(refusesOfflineWorker("fieldbridge-project-harbor.lovable.app", true, false, "")).toBe(false);
    expect(refusesOfflineWorker("fieldbridgeprojects.com", true, false, "")).toBe(false);
    expect(refusesOfflineWorker("preview-v2--shop.example.com", true, false, "")).toBe(false);
  });
});