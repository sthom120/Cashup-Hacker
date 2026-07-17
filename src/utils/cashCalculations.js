import { denominations } from "../data/denominations";
import { defaultFloatTargets } from "../data/floatTargets";

const CHANGE_PLAN_SEARCH_LIMIT = 250000;

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
  const targetFloatTotal =
    calculateTargetFloatTotal(targets);

  return tillTotal - targetFloatTotal;
}

export function calculateExtrasTotal(comparison) {
  return comparison
    .filter((item) => item.status === "extra")
    .reduce(
      (total, item) =>
        total + item.difference * item.valueInCents,
      0,
    );
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
  return getShortageItems(comparison).reduce(
    (total, item) =>
      total + item.quantity * item.valueInCents,
    0,
  );
}

function calculateAvailableExtrasTotal(extras) {
  return extras.reduce(
    (total, item) =>
      total + item.difference * item.valueInCents,
    0,
  );
}

function findMinimumRequiredItemCount(
  extras,
  requiredValueInCents,
) {
  let runningTotal = 0;
  let itemCount = 0;

  for (const item of extras) {
    if (runningTotal >= requiredValueInCents) {
      break;
    }

    const remainingValue =
      requiredValueInCents - runningTotal;

    const quantityNeeded = Math.ceil(
      remainingValue / item.valueInCents,
    );

    const quantityToUse = Math.min(
      item.availableQuantity,
      quantityNeeded,
    );

    runningTotal +=
      quantityToUse * item.valueInCents;

    itemCount += quantityToUse;
  }

  if (runningTotal < requiredValueInCents) {
    return null;
  }

  return itemCount;
}

function calculateMaximumPossibleTotal(
  availableExtras,
  startIndex,
  itemSlots,
) {
  let slotsRemaining = itemSlots;
  let total = 0;

  for (
    let index = startIndex;
    index < availableExtras.length;
    index += 1
  ) {
    if (slotsRemaining === 0) {
      break;
    }

    const item = availableExtras[index];

    const quantity = Math.min(
      item.availableQuantity,
      slotsRemaining,
    );

    total += quantity * item.valueInCents;
    slotsRemaining -= quantity;
  }

  return slotsRemaining === 0 ? total : null;
}

function calculateMinimumPossibleTotal(
  availableExtras,
  startIndex,
  itemSlots,
) {
  let slotsRemaining = itemSlots;
  let total = 0;

  for (
    let index = availableExtras.length - 1;
    index >= startIndex;
    index -= 1
  ) {
    if (slotsRemaining === 0) {
      break;
    }

    const item = availableExtras[index];

    const quantity = Math.min(
      item.availableQuantity,
      slotsRemaining,
    );

    total += quantity * item.valueInCents;
    slotsRemaining -= quantity;
  }

  return slotsRemaining === 0 ? total : null;
}

function findDepositCombination(
  extras,
  requiredValueInCents,
) {
  const availableExtras = extras
    .filter((item) => item.difference > 0)
    .map((item) => ({
      id: item.id,
      label: item.label,
      valueInCents: item.valueInCents,
      availableQuantity: item.difference,
    }))
    .sort(
      (first, second) =>
        second.valueInCents - first.valueInCents,
    );

  const minimumItemCount =
    findMinimumRequiredItemCount(
      availableExtras,
      requiredValueInCents,
    );

  if (minimumItemCount === null) {
    return {
      combination: null,
      searchLimitReached: false,
    };
  }

  const remainingItemCounts =
    new Array(availableExtras.length + 1).fill(0);

  for (
    let index = availableExtras.length - 1;
    index >= 0;
    index -= 1
  ) {
    remainingItemCounts[index] =
      remainingItemCounts[index + 1] +
      availableExtras[index].availableQuantity;
  }

  let bestCombination = null;
  let searchCount = 0;
  let searchLimitReached = false;

  function search(
    index,
    slotsRemaining,
    selectedTotal,
    selectedQuantities,
  ) {
    searchCount += 1;

    if (searchCount > CHANGE_PLAN_SEARCH_LIMIT) {
      searchLimitReached = true;
      return;
    }

    if (slotsRemaining === 0) {
      if (
        selectedTotal >= requiredValueInCents &&
        (
          bestCombination === null ||
          selectedTotal <
            bestCombination.totalInCents
        )
      ) {
        bestCombination = {
          totalInCents: selectedTotal,
          quantities: [...selectedQuantities],
        };
      }

      return;
    }

    if (index >= availableExtras.length) {
      return;
    }

    if (
      remainingItemCounts[index] <
      slotsRemaining
    ) {
      return;
    }

    const maximumAdditionalTotal =
      calculateMaximumPossibleTotal(
        availableExtras,
        index,
        slotsRemaining,
      );

    if (
      maximumAdditionalTotal === null ||
      selectedTotal + maximumAdditionalTotal <
        requiredValueInCents
    ) {
      return;
    }

    const minimumAdditionalTotal =
      calculateMinimumPossibleTotal(
        availableExtras,
        index,
        slotsRemaining,
      );

    if (
      bestCombination &&
      minimumAdditionalTotal !== null &&
      selectedTotal + minimumAdditionalTotal >=
        bestCombination.totalInCents
    ) {
      return;
    }

    const item = availableExtras[index];

    const minimumQuantity = Math.max(
      0,
      slotsRemaining -
        remainingItemCounts[index + 1],
    );

    const maximumQuantity = Math.min(
      item.availableQuantity,
      slotsRemaining,
    );

    for (
      let quantity = minimumQuantity;
      quantity <= maximumQuantity;
      quantity += 1
    ) {
      selectedQuantities[index] = quantity;

      search(
        index + 1,
        slotsRemaining - quantity,
        selectedTotal +
          quantity * item.valueInCents,
        selectedQuantities,
      );

      if (searchLimitReached) {
        return;
      }
    }

    selectedQuantities[index] = 0;
  }

  search(
    0,
    minimumItemCount,
    0,
    new Array(availableExtras.length).fill(0),
  );

  if (!bestCombination) {
    return {
      combination: null,
      searchLimitReached,
    };
  }

  const items = availableExtras
    .map((item, index) => ({
      id: item.id,
      label: item.label,
      valueInCents: item.valueInCents,
      quantity:
        bestCombination.quantities[index] ?? 0,
    }))
    .filter((item) => item.quantity > 0);

  return {
    combination: {
      items,
      totalInCents:
        bestCombination.totalInCents,
    },
    searchLimitReached,
  };
}

export function breakAmountIntoDenominations(
  amountInCents,
) {
  if (
    !Number.isInteger(amountInCents) ||
    amountInCents < 0
  ) {
    throw new Error(
      "The amount must be a non-negative whole number of cents.",
    );
  }

  let remainingAmount = amountInCents;
  const result = [];

  denominations.forEach((denomination) => {
    const quantity = Math.floor(
      remainingAmount /
        denomination.valueInCents,
    );

    if (quantity > 0) {
      result.push({
        ...denomination,
        quantity,
      });

      remainingAmount -=
        quantity * denomination.valueInCents;
    }
  });

  if (remainingAmount !== 0) {
    throw new Error(
      `Unable to create exact change. Remaining amount: ${remainingAmount} cents.`,
    );
  }

  return result;
}

function combineWithdrawalItems(
  shortages,
  remainderItems,
) {
  const withdrawalMap = new Map();

  [...shortages, ...remainderItems].forEach(
    (item) => {
      const existingItem =
        withdrawalMap.get(item.id);

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
    },
  );

  return denominations
    .map((denomination) =>
      withdrawalMap.get(denomination.id),
    )
    .filter(Boolean);
}

function createManualHelpPlan({
  failureCode,
  reason,
  staffAction,
  shortages,
  shortagesTotal,
  availableExtrasTotal,
}) {
  return {
    required: true,
    possible: false,
    status: "manual-help",
    failureCode,
    reason,
    staffAction,
    shortagesTotalInCents: shortagesTotal,
    availableExtrasTotalInCents:
      availableExtrasTotal,
    depositItems: [],
    depositTotalInCents: 0,
    shortageItems: shortages,
    withdrawalItems: [],
    remainderItems: [],
    remainderTotalInCents: 0,
  };
}

export function calculateChangeBagPlan(comparison) {
  const extras = comparison.filter(
    (item) => item.status === "extra",
  );

  const shortages = getShortageItems(comparison);

  const shortagesTotal =
    calculateShortagesTotal(comparison);

  const availableExtrasTotal =
    calculateAvailableExtrasTotal(extras);

  if (shortagesTotal === 0) {
    return {
      required: false,
      possible: true,
      status: "not-required",
      failureCode: null,
      reason: null,
      staffAction: null,
      shortagesTotalInCents: 0,
      availableExtrasTotalInCents:
        availableExtrasTotal,
      depositItems: [],
      depositTotalInCents: 0,
      shortageItems: [],
      withdrawalItems: [],
      remainderItems: [],
      remainderTotalInCents: 0,
    };
  }

  if (availableExtrasTotal < shortagesTotal) {
    return createManualHelpPlan({
      failureCode: "INSUFFICIENT_EXTRAS",
      reason:
        "The extra money removed from the till is not enough to cover all Float shortages.",
      staffAction:
        "Check the till count. If the count is correct, ask a manager to add the missing value from another approved cash source.",
      shortages,
      shortagesTotal,
      availableExtrasTotal,
    });
  }

  const depositSearch = findDepositCombination(
    extras,
    shortagesTotal,
  );

  if (depositSearch.searchLimitReached) {
    return createManualHelpPlan({
      failureCode: "SEARCH_LIMIT_REACHED",
      reason:
        "The app could not safely calculate a simple Change Bag exchange from this unusually large combination of notes and coins.",
      staffAction:
        "Ask a manager to complete the exchange manually and confirm that the final Float matches the target.",
      shortages,
      shortagesTotal,
      availableExtrasTotal,
    });
  }

  if (!depositSearch.combination) {
    return createManualHelpPlan({
      failureCode: "NO_SAFE_DEPOSIT",
      reason:
        "The available Takings have enough total value, but the app could not find a safe group of notes and coins to deposit.",
      staffAction:
        "Check the counted denominations and ask a manager to complete the Change Bag exchange manually.",
      shortages,
      shortagesTotal,
      availableExtrasTotal,
    });
  }

  const deposit = depositSearch.combination;

  const remainderTotalInCents =
    deposit.totalInCents - shortagesTotal;

  let remainderItems;

  try {
    remainderItems =
      breakAmountIntoDenominations(
        remainderTotalInCents,
      );
  } catch {
    return createManualHelpPlan({
      failureCode: "UNSUPPORTED_REMAINDER",
      reason:
        "The remaining value could not be represented using the supported Australian denominations.",
      staffAction:
        "Do not follow an estimated exchange. Ask a manager to check the Change Bag manually.",
      shortages,
      shortagesTotal,
      availableExtrasTotal,
    });
  }

  const withdrawalItems =
    combineWithdrawalItems(
      shortages,
      remainderItems,
    );

  const withdrawalTotalInCents =
    withdrawalItems.reduce(
      (total, item) =>
        total +
        item.quantity * item.valueInCents,
      0,
    );

  if (
    withdrawalTotalInCents !==
    deposit.totalInCents
  ) {
    return createManualHelpPlan({
      failureCode: "PLAN_TOTAL_MISMATCH",
      reason:
        "The calculated Change Bag deposit and withdrawal totals do not match.",
      staffAction:
        "Do not move any money. Return to the till count and ask a manager to check the cash-up.",
      shortages,
      shortagesTotal,
      availableExtrasTotal,
    });
  }

  return {
    required: true,
    possible: true,
    status: "ready",
    failureCode: null,
    reason: null,
    staffAction: null,
    shortagesTotalInCents: shortagesTotal,
    availableExtrasTotalInCents:
      availableExtrasTotal,
    depositItems: deposit.items,
    depositTotalInCents:
      deposit.totalInCents,
    shortageItems: shortages,
    withdrawalItems,
    withdrawalTotalInCents,
    remainderItems,
    remainderTotalInCents,
  };
}