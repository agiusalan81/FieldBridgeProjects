import { describe, expect, it, vi } from "vitest";
import { initializeAccountAccess } from "./account-access";

describe("account access initialization", () => {
  it("uses only the signed-in database identity, without a caller-supplied role or user", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 1, error: null });
    expect(await initializeAccountAccess({ rpc })).toBe(1);
    expect(rpc).toHaveBeenCalledExactlyOnceWith("claim_invites");
  });

  it("accepts an idempotent repeat without adding membership", async () => {
    expect(await initializeAccountAccess({ rpc: async () => ({ data: 0, error: null }) })).toBe(0);
  });

  it("does not report readiness when enrollment fails", async () => {
    await expect(initializeAccountAccess({ rpc: async () => ({ data: null, error: { message: "Access unavailable" } }) })).rejects.toThrow("Access unavailable");
  });

  it("does not treat missing or invalid enrollment results as success", async () => {
    for (const data of [null, "manager", -1, 0.5]) {
      await expect(initializeAccountAccess({ rpc: async () => ({ data, error: null }) })).rejects.toThrow("Could not confirm account access");
    }
  });
});