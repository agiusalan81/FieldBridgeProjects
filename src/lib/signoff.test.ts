import { describe, it, expect } from "vitest";
import { signoffOpen, isToken } from "./signoff";
const now = new Date("2026-11-25T10:00:00Z");
describe("remote sign-off", () => {
  it("pending and in date can be signed", () => expect(signoffOpen({ status: "Pending", expires_at: "2026-12-01T00:00:00Z" }, now)).toBe(true));
  it("already signed cannot be signed again", () => expect(signoffOpen({ status: "Approved", expires_at: "2026-12-01T00:00:00Z" }, now)).toBe(false));
  it("expired link cannot be signed", () => expect(signoffOpen({ status: "Pending", expires_at: "2026-11-24T00:00:00Z" }, now)).toBe(false));
  it("tokens must be 48 hex chars", () => { expect(isToken("a".repeat(48))).toBe(true); expect(isToken("abc")).toBe(false); });
});
