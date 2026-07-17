import { denominations } from "../data/denominations";
import { defaultFloatTargets } from "../data/floatTargets";

export function formatCurrency(valueInCents) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(valueInCents / 100);
}

export function calculateTargetFloatTotal(
  targets = defaultFloatTargets,
) {
  return denominations.reduce((total, denomination) => {
    const targetCount = targets[denomination.id] ?? 0;

    return total + targetCount * denomination.valueInCents;
  }, 0);
}

export function calculateTillTotal(counts) {
  return denominations.reduce((total, denomination) => {
    const count = counts[denomination.id] ?? 0;

    return total + count * denomination.valueInCents;
  }, 0);
}

export function compareWithTarget(
  counts,
  targets = defaultFloatTargets,
) {
  return denominations.map((denomination) => {
    const counted = counts[denomination.id] ?? 0;
    const target = targets[denomination.id] ?? 0;
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

export function calculateExpectedTakings(
  counts,
  targets = defaultFloatTargets,
) {
  const tillTotal = calculateTillTotal(counts);
  const targetFloatTotal = calculateTargetFloatTotal(targets);

  return tillTotal - targetFloatTotal;
}

export function calculateExtrasTotal(comparison) {
  return comparison
    .filter((item) => item.status === "extra")
    .reduce((total, item) => {
      return total + item.difference * item.valueInCents;
    }, 0);
}

export function getShortageItems(comparison) {
  return comparison
    .filter((item) => item.status === "short")
    .map((item) => ({
      ...item,
      quantity: Math.abs(item.difference),
    }));
}

export function calculateShortagesTotal(comparison) {
  return getShortageItems(comparison).reduce((total, item) => {
    return total + item.quantity * item.valueInCents;
  }, 0);
}

function findDepositCombination(extras, requiredValueInCents) {
  const availableItems = extras.flatMap((item) =>
    Array.from({ length: item.difference }, () => ({
      id: item.id,
      label: item.label,
      valueInCents: item.valueInCents,
    })),
  );

  let bestCombination = null;

  function search(index, selectedItems, selectedTotal) {
    if (selectedTotal >= requiredValueInCents) {
      const candidate = {
        items: [...selectedItems],
        totalInCents: selectedTotal,
      };

      const isBetter =
        bestCombination === null ||
        candidate.items.length < bestCombination.items.length ||
        (candidate.items.length === bestCombination.items.length &&
          candidate.totalInCents < bestCombination.totalInCents);

      if (isBetter) {
        bestCombination = candidate;
      }

      return;
    }

    if (index >= availableItems.length) {
      return;
    }

    if (
      bestCombination &&
      selectedItems.length >= bestCombination.items.length
    ) {
      return;
    }

    search(
      index + 1,
      [...selectedItems, availableItems[index]],
      selectedTotal + availableItems[index].valueInCents,
    );

    search(index + 1, selectedItems, selectedTotal);
  }

  search(0, [], 0);

  return bestCombination;
}

function groupMoneyItems(items) {
  const groupedItems = new Map();

  items.forEach((item) => {
    const existingItem = groupedItems.get(item.id);

    if (existingItem) {
      existingItem.quantity += 1;
      return;
    }

    groupedItems.set(item.id, {
      id: item.id,
      label: item.label,
      valueInCents: item.valueInCents,
      quantity: 1,
    });
  });

  return denominations
    .map((denomination) => groupedItems.get(denomination.id))
    .filter(Boolean);
}

export function breakAmountIntoDenominations(amountInCents) {
  let remainingAmount = amountInCents;
  const result = [];

  denominations.forEach((denomination) => {
    const quantity = Math.floor(
      remainingAmount / denomination.valueInCents,
    );

    if (quantity > 0) {
      result.push({
        ...denomination,
        quantity,
      });

      remainingAmount -= quantity * denomination.valueInCents;
    }
  });

  if (remainingAmount !== 0) {
    throw new Error(
      `Unable to create exact change. Remaining amount: ${remainingAmount} cents.`,
    );
  }

  return result;
}

export function calculateChangeBagPlan(comparison) {
  const extras = comparison.filter((item) => item.status === "extra");
  const shortages = getShortageItems(comparison);
  const shortagesTotal = calculateShortagesTotal(comparison);

  if (shortagesTotal === 0) {
    return {
      required: false,
      depositItems: [],
      depositTotalInCents: 0,
      shortageItems: [],
      withdrawalItems: [],
      remainderItems: [],
      remainderTotalInCents: 0,
    };
  }

  const deposit = findDepositCombination(extras, shortagesTotal);

  if (!deposit) {
    return {
      required: true,
      possible: false,
      reason:
        "There is not enough suitable money in Takings to cover the float shortages.",
      depositItems: [],
      depositTotalInCents: 0,
      shortageItems: shortages,
      withdrawalItems: [],
      remainderItems: [],
      remainderTotalInCents: 0,
    };
  }

  const depositItems = groupMoneyItems(deposit.items);
  const remainderTotalInCents =
    deposit.totalInCents - shortagesTotal;

  const remainderItems = breakAmountIntoDenominations(
    remainderTotalInCents,
  );

  const withdrawalMap = new Map();

  [...shortages, ...remainderItems].forEach((item) => {
    const existingItem = withdrawalMap.get(item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
      return;
    }

    withdrawalMap.set(item.id, {
      id: item.id,
      label: item.label,
      valueInCents: item.valueInCents,
      quantity: item.quantity,
    });
  });

  const withdrawalItems = denominations
    .map((denomination) => withdrawalMap.get(denomination.id))
    .filter(Boolean);

  return {
    required: true,
    possible: true,
    depositItems,
    depositTotalInCents: deposit.totalInCents,
    shortageItems: shortages,
    withdrawalItems,
    remainderItems,
    remainderTotalInCents,
  };
}