import { describe, expect, it } from "vitest";
import { advance } from "./recurring";

describe("advance", () => {
  it("adds 7 days for weekly (crossing a month boundary)", () => {
    expect(advance("2025-01-01", "weekly")).toBe("2025-01-08");
    expect(advance("2025-01-28", "weekly")).toBe("2025-02-04");
  });

  it("adds 14 days for biweekly", () => {
    expect(advance("2025-01-01", "biweekly")).toBe("2025-01-15");
  });

  it("adds a month for monthly, clamping at month-end", () => {
    expect(advance("2025-01-15", "monthly")).toBe("2025-02-15");
    expect(advance("2025-01-31", "monthly")).toBe("2025-02-28"); // not Mar 3
    expect(advance("2024-01-31", "monthly")).toBe("2024-02-29"); // leap year
    expect(advance("2025-03-31", "monthly")).toBe("2025-04-30"); // Apr has 30
    expect(advance("2025-12-31", "monthly")).toBe("2026-01-31"); // year rollover
  });

  it("adds three months for quarterly, clamping", () => {
    expect(advance("2025-01-15", "quarterly")).toBe("2025-04-15");
    expect(advance("2024-11-30", "quarterly")).toBe("2025-02-28"); // Feb clamps
  });

  it("adds a year for yearly, clamping Feb 29", () => {
    expect(advance("2025-03-10", "yearly")).toBe("2026-03-10");
    expect(advance("2024-02-29", "yearly")).toBe("2025-02-28"); // non-leap target
  });
});
