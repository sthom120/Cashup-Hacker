const CASH_UP_PROGRESS_STORAGE_KEY =
  "cash-up-hacker-active-cash-up";

export function loadCashUpProgress() {
  try {
    const savedProgress = localStorage.getItem(
      CASH_UP_PROGRESS_STORAGE_KEY,
    );

    if (!savedProgress) {
      return null;
    }

    const parsedProgress = JSON.parse(savedProgress);

    if (
      !parsedProgress ||
      typeof parsedProgress.counts !== "object" ||
      typeof parsedProgress.currentStep !== "string"
    ) {
      return null;
    }

    return parsedProgress;
  } catch {
    return null;
  }
}

export function saveCashUpProgress(progress) {
  localStorage.setItem(
    CASH_UP_PROGRESS_STORAGE_KEY,
    JSON.stringify(progress),
  );
}

export function clearCashUpProgress() {
  localStorage.removeItem(CASH_UP_PROGRESS_STORAGE_KEY);
}

export function hasMeaningfulCashUpProgress(progress) {
  if (!progress) {
    return false;
  }

  const hasEnteredCounts = Object.values(
    progress.counts ?? {},
  ).some((count) => count > 0);

  const hasMovedPastCount =
    progress.currentStep !== "count";

  const hasCompletionTime = Boolean(progress.completedAt);

  return (
    hasEnteredCounts ||
    hasMovedPastCount ||
    hasCompletionTime
  );
}
