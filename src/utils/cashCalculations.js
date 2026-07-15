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