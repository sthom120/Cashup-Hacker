import { describe, expect, it } from "vitest";
import {
  breakAmountIntoDenominations,
  calculateChangeBagPlan,
  calculateExpectedTakings,
  calculateExtrasTotal,
  calculateShortagesTotal,
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

  it("calculates the example extras as $200", () => {
    const comparison = compareWithTarget(exampleCounts);

    expect(calculateExtrasTotal(comparison)).toBe(20000);
  });

  it("calculates the shortages as $62.15", () => {
    const comparison = compareWithTarget(exampleCounts);

    expect(calculateShortagesTotal(comparison)).toBe(6215);
  });

  it("breaks $37.85 into Australian denominations", () => {
    expect(breakAmountIntoDenominations(3785)).toEqual([
      {
        id: "20-dollar",
        label: "$20",
        valueInCents: 2000,
        quantity: 1,
      },
      {
        id: "10-dollar",
        label: "$10",
        valueInCents: 1000,
        quantity: 1,
      },
      {
        id: "5-dollar",
        label: "$5",
        valueInCents: 500,
        quantity: 1,
      },
      {
        id: "2-dollar",
        label: "$2",
        valueInCents: 200,
        quantity: 1,
      },
      {
        id: "50-cent",
        label: "50c",
        valueInCents: 50,
        quantity: 1,
      },
      {
        id: "20-cent",
        label: "20c",
        valueInCents: 20,
        quantity: 1,
      },
      {
        id: "10-cent",
        label: "10c",
        valueInCents: 10,
        quantity: 1,
      },
      {
        id: "5-cent",
        label: "5c",
        valueInCents: 5,
        quantity: 1,
      },
    ]);
  });

  it("creates the correct Change Bag deposit for the example", () => {
    const comparison = compareWithTarget(exampleCounts);
    const plan = calculateChangeBagPlan(comparison);

    expect(plan.possible).toBe(true);
    expect(plan.depositTotalInCents).toBe(10000);

    expect(plan.depositItems).toEqual([
      {
        id: "50-dollar",
        label: "$50",
        valueInCents: 5000,
        quantity: 2,
      },
    ]);
  });

  it("creates the correct items to put into the Float", () => {
    const comparison = compareWithTarget(exampleCounts);
    const plan = calculateChangeBagPlan(comparison);

    expect(plan.shortageItems).toEqual([
      expect.objectContaining({
        id: "20-dollar",
        quantity: 3,
      }),
      expect.objectContaining({
        id: "2-dollar",
        quantity: 1,
      }),
      expect.objectContaining({
        id: "5-cent",
        quantity: 3,
      }),
    ]);
  });

  it("calculates $37.85 remaining for Takings", () => {
    const comparison = compareWithTarget(exampleCounts);
    const plan = calculateChangeBagPlan(comparison);

    expect(plan.remainderTotalInCents).toBe(3785);
  });

  it("creates the complete Change Bag withdrawal list", () => {
    const comparison = compareWithTarget(exampleCounts);
    const plan = calculateChangeBagPlan(comparison);

    expect(
      plan.withdrawalItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    ).toEqual([
      { id: "20-dollar", quantity: 4 },
      { id: "10-dollar", quantity: 1 },
      { id: "5-dollar", quantity: 1 },
      { id: "2-dollar", quantity: 2 },
      { id: "50-cent", quantity: 1 },
      { id: "20-cent", quantity: 1 },
      { id: "10-cent", quantity: 1 },
      { id: "5-cent", quantity: 4 },
    ]);
  });

  it("does not require the Change Bag for an exact float", () => {
    const comparison = compareWithTarget(exactTargetCounts);
    const plan = calculateChangeBagPlan(comparison);

    expect(plan.required).toBe(false);
  });
});