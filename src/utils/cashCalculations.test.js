import { describe, expect, it } from "vitest";
import {
  calculateExpectedTakings,
  calculateExtrasTotal,
  calculateTargetFloatTotal,
  calculateTillTotal,
  compareWithTarget,
  formatCurrency,
} from "./cashCalculations";

const exampleCounts = {
  "50-dollar": 4,
  "20-dollar": 7,
  "10-dollar": 15,
  "5-dollar": 10,
  "2-dollar": 14,
  "1-dollar": 11,
  "50-cent": 10,
  "20-cent": 10,
  "10-cent": 10,
  "5-cent": 17,
};

const exactTargetCounts = {
  "50-dollar": 1,
  "20-dollar": 10,
  "10-dollar": 10,
  "5-dollar": 10,
  "2-dollar": 15,
  "1-dollar": 11,
  "50-cent": 10,
  "20-cent": 10,
  "10-cent": 10,
  "5-cent": 20,
};

describe("cash calculations", () => {
  it("calculates the target float as $450", () => {
    expect(calculateTargetFloatTotal()).toBe(45000);
  });

  it("calculates the example till total as $587.85", () => {
    expect(calculateTillTotal(exampleCounts)).toBe(58785);
  });

  it("calculates expected takings as $137.85", () => {
    expect(calculateExpectedTakings(exampleCounts)).toBe(13785);
  });

  it("formats cents as Australian currency", () => {
    expect(formatCurrency(58785)).toBe("$587.85");
  });

  it("identifies the correct extras", () => {
    const comparison = compareWithTarget(exampleCounts);

    const extras = comparison
      .filter((item) => item.status === "extra")
      .map((item) => ({
        id: item.id,
        difference: item.difference,
      }));

    expect(extras).toEqual([
      { id: "50-dollar", difference: 3 },
      { id: "10-dollar", difference: 5 },
    ]);
  });

  it("identifies the correct shortages", () => {
    const comparison = compareWithTarget(exampleCounts);

    const shortages = comparison
      .filter((item) => item.status === "short")
      .map((item) => ({
        id: item.id,
        difference: item.difference,
      }));

    expect(shortages).toEqual([
      { id: "20-dollar", difference: -3 },
      { id: "2-dollar", difference: -1 },
      { id: "5-cent", difference: -3 },
    ]);
  });

  it("shows every denomination as correct for an exact target float", () => {
    const comparison = compareWithTarget(exactTargetCounts);

    expect(
      comparison.every((item) => item.status === "correct"),
    ).toBe(true);
  });

  it("calculates zero takings for an exact target float", () => {
    expect(calculateExpectedTakings(exactTargetCounts)).toBe(0);
  });

  it("handles missing counts as zero", () => {
    expect(calculateTillTotal({})).toBe(0);
  });
});

it("calculates the example extras as $200", () => {
  const comparison = compareWithTarget(exampleCounts);

  expect(calculateExtrasTotal(comparison)).toBe(20000);
});