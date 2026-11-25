import { openDB } from "idb";
import { supabase } from "@/integrations/supabase/client";
import { nextNumber } from "./workflow";
import type { User } from "@supabase/supabase-js";

export type LocalRow = Record<string, unknown>;
export type SiteWrite = { table: "rfis" | "snags" | "drawing_pins"; row: LocalRow };
export type PendingSiteRecord = { id: string; userId: string; projectId: string; writes: SiteWrite[]; cursor: number; createdAt: string; error: string | null };
const store = () => openDB("fieldbridge-offline-v1", 1, { upgrade(db) { db.createObjectStore("cache"); db.createObjectStore("outbox", { keyPath: "id" }); db.createObjectStore("access"); } });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as unknown as { from: (table: string) => any }; // Schema can lag; matches db.ts.
export const isDisconnected = () => typeof navigator !== "undefined" && !navigator.onLine;
export function offlineChanged() { window.dispatchEvent(new Event("fieldbridge-offline")); }

export async function localIdentity() {
  if (isDisconnected()) {
    // Access only previously confirmed device data when the online token has expired.
    // This is not a bearer token and is never used to authenticate replay.
    const cached = await (await store()).get("access", "last-confirmed-identity") as User | undefined;
    return cached ?? null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
export async function rememberAccess(projectId: string) {
  const user = await localIdentity();
  if (!user) return;
  const { data, error } = await client.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (data) {
    const database = await store();
    await database.put("access", true, `${user.id}:${projectId}`);
    await database.put("access", user, "last-confirmed-identity");
  }
}
export async function hasLocalAccess(projectId: string) {
  const user = await localIdentity();
  return !!user && !!(await (await store()).get("access", `${user.id}:${projectId}`));
}
/** Cached identity opens local reads only; replay always revalidates Auth and server RLS. */
export async function projectAccessUser(projectId: string) {
  if (isDisconnected()) return await hasLocalAccess(projectId) ? localIdentity() : null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
export async function clearOfflineReads() {
  const database = await store();
  await database.clear("cache");
  await database.clear("access");
  // Retain unsynced work for its original account; it cannot be read by another account.
}
export async function pendingRecords(userId: string, projectId: string) {
  const rows = await (await store()).getAll("outbox") as PendingSiteRecord[];
  return rows.filter((r) => r.userId === userId && r.projectId === projectId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function overlayPending(rows: LocalRow[], jobs: PendingSiteRecord[], table: string) {
  const result = [...rows];
  for (const job of jobs) for (const write of job.writes) {
    if (write.table !== table) continue;
    const index = result.findIndex((r) => r['id'] === write.row['id']);
    const row = { ...write.row, _offline: job.error ? "Sync blocked" : "Queued offline" };
    if (index < 0) result.push(row); else result[index] = row;
  }
  return result;
}

export async function readCachedTable(table: string, projectId: string, options: unknown, fetchRows: () => Promise<LocalRow[]>) {
  const user = await localIdentity();
  if (!user) {
    if (isDisconnected()) throw new Error("Not saved on this device yet. Sign in with a connection first.");
    return fetchRows();
  }
  const database = await store();
  const key = JSON.stringify([user.id, projectId, table, options]);
  let rows: LocalRow[];
  try {
    if (isDisconnected()) throw new Error("Offline");
    rows = await fetchRows();
    if (table === "drawings") rows = await Promise.all(rows.map(async (row) => {
      const url = row['drawing_url'];
      if (typeof url !== "string" || !/^https:\/\//.test(url)) return row;
      try {
        const response = await fetch(url, { credentials: "omit" });
        if (!response.ok) return row;
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) return row;
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return { ...row, drawing_url: data };
      } catch { return row; }
    }));
    // Uploaded sheets/photos are already data URLs; keep their full bytes in IndexedDB.
    try { await database.put("cache", rows, key); }
    catch { window.dispatchEvent(new Event("fieldbridge-storage-error")); }
  } catch (error) {
    const cached = await database.get("cache", key) as LocalRow[] | undefined;
    // Never mask permission errors with old data while connected.
    const code = (error as { code?: string }).code;
    if (!isDisconnected() && code && !code.startsWith("PGRST00")) throw error;
    if (!cached) {
      const queued = await pendingRecords(user.id, projectId);
      if (!queued.some((j) => j.writes.some((w) => w.table === table))) throw new Error("Not saved on this device yet. Open this page with a connection first.");
      rows = [];
    } else rows = cached;
  }
  return overlayPending(rows, await pendingRecords(user.id, projectId), table);
}

/** Persist all dependent writes before attempting the network. Never queue privileged sign-offs. */
export async function saveSiteRecord(projectId: string, writes: SiteWrite[]) {
  const user = await localIdentity();
  if (!user) throw new Error("Sign in before saving a site record.");
  if (!await hasLocalAccess(projectId)) throw new Error("Open this project online before saving offline.");
  if (!writes.length || writes.some((w) => !["rfis", "snags", "drawing_pins"].includes(w.table))) throw new Error("This action requires a connection.");
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const job: PendingSiteRecord = { id, userId: user.id, projectId, writes: writes.map((w) => ({ ...w, row: { ...w.row, id: crypto.randomUUID(), created_by: user.id, created_at: createdAt, ...(w.table === "rfis" ? { date_raised: createdAt.slice(0, 10) } : {}), status: w.row['status'] ?? "Open" } })), cursor: 0, createdAt, error: null };
  try { await (await store()).put("outbox", job); }
  catch { throw new Error("Device storage is full or unavailable. Your record has not been saved; keep this form open."); }
  offlineChanged();
  if (!isDisconnected()) await syncSiteRecords(projectId).catch(() => undefined);
  const stored = await (await store()).get("outbox", id) as PendingSiteRecord | undefined;
  let primary = stored?.writes[0]?.row ?? job.writes[0]?.row;
  const first = job.writes[0];
  if (!stored && first) {
    const cached = await (await store()).get("cache", JSON.stringify([user.id, projectId, first.table, {}])) as LocalRow[] | undefined;
    primary = cached?.find((r) => r['id'] === first.row['id']) ?? primary;
  }
  return { queued: !!stored, ref: String(primary?.['rfi_number'] ?? primary?.['snag_number'] ?? primary?.['reference_id'] ?? "Record") };
}

async function replay(projectId: string) {
  if (isDisconnected()) return;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const local = await localIdentity();
    if (local) for (const job of await pendingRecords(local.id, projectId)) await (await store()).put("outbox", { ...job, error: "Sign in again to sync. Your record and photos are still saved on this device." });
    offlineChanged();
    return;
  }
  const userId = data.user.id;
  const database = await store();
  for (const job of await pendingRecords(userId, projectId)) {
    try {
      for (; job.cursor < job.writes.length; job.cursor++) {
        if (isDisconnected() || (await localIdentity())?.id !== userId) return;
        const write = job.writes[job.cursor];
        if (!write) break;
        // A lost network response can leave the insert committed: check the stable UUID first.
        const existing = await client.from(write.table).select("*").eq("id", write.row['id']).maybeSingle();
        if (existing.error) throw existing.error;
        if (existing.data) write.row = existing.data;
        else {
          const field = write.table === "rfis" ? "rfi_number" : write.table === "snags" ? "snag_number" : "reference_id";
          const oldRef = String(write.row[field] ?? "");
          const prefix = oldRef.split("-")[0] ?? "";
          if (prefix && !(write.table === "drawing_pins" && ["rfi", "snag"].includes(String(write.row['pin_type'])))) {
            let query = client.from(write.table).select(field);
            if (write.table === "drawing_pins") query = query.eq("drawing_id", write.row['drawing_id']).eq("pin_type", write.row['pin_type']);
            else query = query.eq("project_id", projectId);
            const refs = await query;
            if (refs.error) throw refs.error;
            const ref = nextNumber(prefix, (refs.data ?? []).map((r: LocalRow) => String(r[field] ?? "")));
            write.row[field] = ref;
            for (const linked of job.writes.slice(job.cursor + 1)) if (linked.table === "drawing_pins" && linked.row['reference_id'] === oldRef) linked.row['reference_id'] = ref;
          }
          await database.put("outbox", job);
          const result = await client.from(write.table).insert(write.row).select("*").single();
          if (result.error) throw result.error;
          if (result.data) write.row = result.data;
        }
        await database.put("outbox", { ...job, cursor: job.cursor + 1, error: null });
      }
      // Commit the local read copy and removal together, so losing signal after sync loses no local rows.
      const tx = database.transaction(["cache", "outbox"], "readwrite");
      const cache = tx.objectStore("cache");
      const keys = await cache.getAllKeys();
      for (const write of job.writes) {
        const matching = keys.filter((key) => { const parts = JSON.parse(String(key)) as unknown[]; return parts[0] === userId && parts[1] === projectId && parts[2] === write.table; });
        matching.push(JSON.stringify([userId, projectId, write.table, {}]));
        for (const key of new Set(matching)) {
          const rows = (await cache.get(key) ?? []) as LocalRow[];
          await cache.put([...rows.filter((r) => r['id'] !== write.row['id']), write.row], key);
        }
      }
      await tx.objectStore("outbox").delete(job.id);
      await tx.done;
    } catch (error) {
      job.error = error instanceof Error ? error.message : String((error as { message?: string }).message ?? "Could not sync. Retry when connected.");
      await database.put("outbox", job);
      // Keep every row and photo. Stop dependent writes; never silently discard a rejected record.
    }
  }
  offlineChanged();
}
let syncPromise: Promise<void> | undefined;
export async function syncSiteRecords(projectId: string) {
  if (syncPromise) return syncPromise;
  const run = () => replay(projectId);
  syncPromise = navigator.locks ? navigator.locks.request("fieldbridge-outbox", run) : run();
  try { await syncPromise; } finally { syncPromise = undefined; }
}