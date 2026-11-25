import "fake-indexeddb/auto";
import { openDB } from "idb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";

const state = vi.hoisted(() => ({ userId: "user-a", denied: false, failPin: false, lostResponse: false, rows: {} as Record<string, Record<string, unknown>[]>, inserts: [] as string[] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: {
    getSession: async () => ({ data: { session: { user: { id: state.userId } } } }),
    getUser: async () => ({ data: { user: { id: state.userId } }, error: null }),
  },
  from: (table: string) => {
    let inserted: Record<string, unknown> | undefined;
    const filters: [string, unknown][] = [];
    const execute = () => {
      if (state.denied) return { data: null, error: { code: "42501", message: "Permission denied" } };
      if (inserted) {
        if (table === "drawing_pins" && state.failPin) return { data: null, error: { message: "Connection interrupted" } };
        state.inserts.push(table);
        (state.rows[table] ??= []).push({ ...inserted });
        if (state.lostResponse) { state.lostResponse = false; return { data: null, error: { message: "Response lost" } }; }
        return { data: inserted, error: null };
      }
      const rows = (state.rows[table] ?? []).filter((r) => filters.every(([key, val]) => r[key] === val));
      return { data: rows, error: null };
    };
    const query = {
      select: (_fields: string) => query,
      eq: (key: string, val: unknown) => { filters.push([key, val]); return query; },
      insert: (row: Record<string, unknown>) => { inserted = row; return query; },
      maybeSingle: async () => { const result = execute(); return { ...result, data: Array.isArray(result.data) ? result.data[0] ?? null : result.data }; },
      single: async () => execute(),
      then: (resolve: (value: ReturnType<typeof execute>) => unknown) => Promise.resolve(execute()).then(resolve),
    };
    return query;
  },
} }));

import { clearOfflineReads, hasLocalAccess, pendingRecords, projectAccessUser, readCachedTable, rememberAccess, saveSiteRecord, syncSiteRecords } from "./offline";

const rfi = { table: "rfis" as const, row: { project_id: "project-1", rfi_number: "RFI-001", title: "Goods lift clearance", discipline: "MEP - Mechanical", assigned_consultant: "Engineer", programme_impact_days: 3, cost_impact: "Potential", date_required: "2026-12-01" } };
const pin = { table: "drawing_pins" as const, row: { drawing_id: "sheet-1", pin_type: "rfi", reference_id: "RFI-001", x_percent: 12.5, y_percent: 60 } };
describe("durable site outbox", () => {
  beforeEach(async () => {
    vi.stubGlobal("crypto", webcrypto);
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    state.userId = "user-a"; state.denied = false; state.failPin = false; state.lostResponse = false; state.inserts = [];
    state.rows = { projects: [{ id: "project-1" }, { id: "project-2" }] };
    await rememberAccess("project-1");
    const db = await openDB("fieldbridge-offline-v1", 1);
    await db.clear("outbox"); await db.clear("cache"); await db.clear("access");
    await rememberAccess("project-1");
  });
  it("persists offline RFIs and linked pin coordinates before any network insert", async () => {
    Object.defineProperty(navigator, "onLine", { value: false });
    expect((await saveSiteRecord("project-1", [rfi, pin])).queued).toBe(true);
    const jobs = await pendingRecords("user-a", "project-1");
    expect(jobs[0]?.writes[0]?.row).toMatchObject(rfi.row);
    expect(jobs[0]?.writes[1]?.row).toMatchObject(pin.row);
    expect(state.inserts).toHaveLength(0);
    // A fresh IndexedDB read, not in-memory state, returns the complete work.
    const db = await openDB("fieldbridge-offline-v1", 1);
    expect((await db.getAll("outbox"))[0]?.writes[0]?.row['title']).toBe("Goods lift clearance");
  });
  it("retains the photo bytes across queue persistence and sync", async () => {
    Object.defineProperty(navigator, "onLine", { value: false });
    const photo = "data:image/jpeg;base64,cGhvdG8=";
    await saveSiteRecord("project-1", [{ table: "drawing_pins", row: { ...pin.row, pin_type: "observation", reference_id: "OBS-001", photo_url: photo } }]);
    expect((await pendingRecords("user-a", "project-1"))[0]?.writes[0]?.row['photo_url']).toBe(photo);
    Object.defineProperty(navigator, "onLine", { value: true });
    await syncSiteRecords("project-1");
    expect(state.rows['drawing_pins']?.[0]?.['photo_url']).toBe(photo);
  });
  it("replays dependencies once and replaces temporary numbering consistently", async () => {
    Object.defineProperty(navigator, "onLine", { value: false });
    await saveSiteRecord("project-1", [rfi, pin]);
    state.rows['rfis'] = [{ id: "existing", project_id: "project-1", rfi_number: "RFI-021" }];
    Object.defineProperty(navigator, "onLine", { value: true });
    await syncSiteRecords("project-1"); await syncSiteRecords("project-1");
    expect(state.inserts).toEqual(["rfis", "drawing_pins"]);
    expect(state.rows['rfis']?.[1]?.['rfi_number']).toBe("RFI-022");
    expect(state.rows['drawing_pins']?.[0]?.['reference_id']).toBe("RFI-022");
    expect(await pendingRecords("user-a", "project-1")).toHaveLength(0);
    Object.defineProperty(navigator, "onLine", { value: false });
    const cached = await readCachedTable("rfis", "project-1", {}, async () => []);
    expect(cached[0]?.['rfi_number']).toBe("RFI-022");
  });
  it("resumes a partially synced RFI without inserting it twice", async () => {
    state.failPin = true;
    await saveSiteRecord("project-1", [rfi, pin]);
    expect((await pendingRecords("user-a", "project-1"))[0]?.cursor).toBe(1);
    state.failPin = false;
    await syncSiteRecords("project-1");
    expect(state.inserts).toEqual(["rfis", "drawing_pins"]);
  });
  it("recovers a committed insert whose response was lost without duplicating it", async () => {
    state.lostResponse = true;
    await saveSiteRecord("project-1", [rfi, pin]);
    await syncSiteRecords("project-1");
    expect(state.inserts).toEqual(["rfis", "drawing_pins"]);
  });
  it("keeps RLS-rejected work with an error instead of discarding it", async () => {
    state.denied = true;
    await saveSiteRecord("project-1", [rfi, pin]);
    const jobs = await pendingRecords("user-a", "project-1");
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.error).toBe("Permission denied");
    expect(jobs[0]?.writes).toHaveLength(2);
  });
  it("isolates queued work and cached reads by account and project", async () => {
    await readCachedTable("rfis", "project-1", {}, async () => [rfi.row]);
    Object.defineProperty(navigator, "onLine", { value: false });
    await saveSiteRecord("project-1", [rfi]);
    expect(await pendingRecords("user-a", "project-2")).toHaveLength(0);
    state.userId = "user-b";
    // A real account change includes sign-out, which removes the former cached device identity.
    await clearOfflineReads();
    expect(await pendingRecords("user-b", "project-1")).toHaveLength(0);
    expect(await hasLocalAccess("project-1")).toBe(false);
    await expect(readCachedTable("rfis", "project-1", {}, async () => [])).rejects.toThrow("Not saved on this device");
    Object.defineProperty(navigator, "onLine", { value: true });
    await syncSiteRecords("project-1");
    expect(state.inserts).toHaveLength(0);
  });
  it("does not mask permission failures with an old read cache", async () => {
    await readCachedTable("rfis", "project-1", {}, async () => [rfi.row]);
    await expect(readCachedTable("rfis", "project-1", {}, async () => { throw { code: "42501", message: "Denied" }; })).rejects.toMatchObject({ code: "42501" });
  });
  it("rejects sign-off writes instead of queuing them", async () => {
    await expect(saveSiteRecord("project-1", [{ table: "payment_applications", row: { status: "Certified" } }] as unknown as Parameters<typeof saveSiteRecord>[1])).rejects.toThrow("requires a connection");
    expect(await pendingRecords("user-a", "project-1")).toHaveLength(0);
  });
  it("opens previously confirmed local data without a fresh online token, but clears access on sign-out", async () => {
    await readCachedTable("rfis", "project-1", {}, async () => [rfi.row]);
    Object.defineProperty(navigator, "onLine", { value: false });
    expect((await projectAccessUser("project-1"))?.id).toBe("user-a");
    expect((await readCachedTable("rfis", "project-1", {}, async () => []))[0]?.['title']).toBe("Goods lift clearance");
    await clearOfflineReads();
    expect(await projectAccessUser("project-1")).toBeNull();
  });
});