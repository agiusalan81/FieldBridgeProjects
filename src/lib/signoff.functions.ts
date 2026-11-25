import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { isToken, signoffOpen } from "./signoff";

const PUBLIC_COLS = "title, summary, amount, photos, signer_name, signer_role, status, decision_note, signed_name, signed_at, expires_at, item_type, created_at";

export const getSignoff = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: z.string() }).parse(i))
  .handler(async ({ data }) => {
    if (!isToken(data.token)) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r } = await supabaseAdmin.from("signoff_requests" as never).select(PUBLIC_COLS).eq("token", data.token).maybeSingle();
    return r ? (JSON.parse(JSON.stringify(r)) as Record<string, string | number | null | string[]>) : null;
  });

export const submitSignoff = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({
    token: z.string(),
    decision: z.enum(["Approved", "Rejected"]),
    name: z.string().trim().min(2).max(100),
    note: z.string().trim().max(1000).optional(),
    signature: z.string().startsWith("data:image/png;base64,").max(400_000),
  }).parse(i))
  .handler(async ({ data }) => {
    if (!isToken(data.token)) throw new Error("Invalid link");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const t = supabaseAdmin.from("signoff_requests" as never);
    const { data: r } = await t.select("id, status, expires_at").eq("token", data.token).maybeSingle();
    const row = r as { id: string; status: string; expires_at: string } | null;
    if (!row || !signoffOpen(row)) throw new Error("This sign-off link is no longer open");
    const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0] ?? null;
    const { error } = await supabaseAdmin.from("signoff_requests" as never).update({
      status: data.decision, signed_name: data.name, decision_note: data.note ?? null, signature_data_url: data.signature,
      signed_at: new Date().toISOString(), signed_ip: ip, signed_user_agent: (getRequestHeader("user-agent") ?? "").slice(0, 300),
    } as never).eq("id", row.id).eq("status", "Pending");
    if (error) throw new Error("Could not save the signature");
    return { ok: true };
  });
