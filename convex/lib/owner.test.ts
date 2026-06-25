import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { requireOwner } from "./owner";

type Coded = ConvexError<{ code: string; message: string }>;

describe("requireOwner", () => {
  it("returns the doc when the caller owns it", () => {
    const doc = { userId: "u1", amountMinor: 42 };
    expect(requireOwner("u1", doc)).toBe(doc);
  });

  it("throws NOT_FOUND when the doc is null", () => {
    try {
      requireOwner("u1", null);
      expect.unreachable("requireOwner should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as Coded).data.code).toBe("NOT_FOUND");
    }
  });

  it("throws FORBIDDEN when another user owns the doc", () => {
    try {
      requireOwner("u1", { userId: "u2" });
      expect.unreachable("requireOwner should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as Coded).data.code).toBe("FORBIDDEN");
    }
  });
});
