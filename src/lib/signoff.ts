/** Remote sign-off rules: a link can be used once, only while pending and before expiry. */
export type SignoffState = { status: string; expires_at: string };
export function signoffOpen(r: SignoffState, now = new Date()) {
  return r.status === "Pending" && new Date(r.expires_at).getTime() > now.getTime();
}
export const isToken = (t: string) => /^[a-f0-9]{48}$/.test(t);
