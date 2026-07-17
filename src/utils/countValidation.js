export const MAX_COUNT = 999;

export function sanitiseCountInput(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const wholeNumber = Math.floor(numericValue);

  return Math.min(
    MAX_COUNT,
    Math.max(0, wholeNumber),
  );
}