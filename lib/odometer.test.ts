import { describe, expect, it } from "vitest";
import {
  distanceOf,
  formatDistance,
  type OdometerRow,
  toMiles,
  totalDistance,
} from "./odometer";

describe("distanceOf", () => {
  it("computes a closed reading's distance", () => {
    expect(distanceOf({ startReading: 100, endReading: 180 })).toBe(80);
  });

  it("treats an open reading (no end) as 0", () => {
    expect(distanceOf({ startReading: 100 })).toBe(0);
  });

  it("clamps a negative delta to 0", () => {
    expect(distanceOf({ startReading: 200, endReading: 150 })).toBe(0);
  });
});

describe("totalDistance", () => {
  it("sums closed readings and ignores open ones", () => {
    const rows: OdometerRow[] = [
      { startReading: 0, endReading: 50 },
      { startReading: 50, endReading: 120 },
      { startReading: 120 }, // open
    ];
    expect(totalDistance(rows)).toBe(120);
  });
});

describe("toMiles", () => {
  it("passes miles through and converts km", () => {
    expect(toMiles(10, "mi")).toBe(10);
    expect(toMiles(16.0934, "km")).toBeCloseTo(10);
  });
});

describe("formatDistance", () => {
  it("appends the unit", () => {
    expect(formatDistance(80, "mi")).toBe("80 mi");
    expect(formatDistance(1234.5, "km")).toContain("km");
  });
});
