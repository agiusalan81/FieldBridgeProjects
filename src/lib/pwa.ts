export function refusesOfflineWorker(host: string, production: boolean, framed: boolean, search: string) {
  host = host.toLowerCase();
  const platforms = ["lovable.app", "gpt-eng.com", "gptengineer.run"];
  const label = host.split(".")[0] ?? "";
  return !production || framed || new URLSearchParams(search).get("sw") === "off" ||
    ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some((domain) => host === domain || host.endsWith(`.${domain}`)) ||
    platforms.some((domain) => host.endsWith(`.${domain}`) && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) || label === "project--452db569-4c2a-456b-aee7-17dd29230072-dev"));
}

/** The sole app-shell registrar. Called after hydration only. */
export async function registerOfflineWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (refusesOfflineWorker(window.location.hostname.toLowerCase(), import.meta.env.PROD, window.self !== window.top, window.location.search)) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((r) => [r.active, r.waiting, r.installing].some((w) => w && new URL(w.scriptURL).pathname === "/sw.js")).map((r) => r.unregister()));
    return;
  }
  await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}