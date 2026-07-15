import { denominations } from "../data/denominations";
import { floatTargets } from "../data/floatTargets";

export function formatCurrency(valueInCents) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(valueInCents / 100);
}

export function calculateTargetFloatTotal() {
  return denominations.reduce((total, denomination) => {
    const targetCount = floatTargets[denomination.id] ?? 0;

    return total + targetCount * denomination.valueInCents;
  }, 0);
}

export function calculateTillTotal(counts) {
  return denominations.reduce((total, denomination) => {
    const count = counts[denomination.id] ?? 0;

    return total + count * denomination.valueInCents;
  }, 0);
}

export function compareWithTarget(counts) {
  return denominations.map((denomination) => {
    const counted = counts[denomination.id] ?? 0;
    const target = floatTargets[denomination.id] ?? 0;
    const difference = counted - target;

    let status = "correct";

    if (difference > 0) {
      status = "extra";
    }

    if (difference < 0) {
      status = "short";
    }

    return {
      ...denomination,
      counted,
      target,
      difference,
      status,
      differenceValueInCents:
        Math.abs(difference) * denomination.valueInCents,
    };
  });
}

export function calculateExpectedTakings(counts) {
  const tillTotal = calculateTillTotal(counts);
  const targetFloatTotal = calculateTargetFloatTotal();

  return tillTotal - targetFloatTotal;
}

export function calculateExtrasTotal(comparison) {
  return comparison
    .filter((item) => item.status === "extra")
    .reduce((total, item) => {
      return total + item.difference * item.valueInCents;
    }, 0);
}