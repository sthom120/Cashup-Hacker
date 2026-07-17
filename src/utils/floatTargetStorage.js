import {
  defaultFloatTargets,
  FLOAT_TARGETS_STORAGE_KEY,
} from "../data/floatTargets";

export function loadFloatTargets() {
  try {
    const storedTargets = localStorage.getItem(
      FLOAT_TARGETS_STORAGE_KEY,
    );

    if (!storedTargets) {
      return { ...defaultFloatTargets };
    }

    const parsedTargets = JSON.parse(storedTargets);

    return {
      ...defaultFloatTargets,
      ...parsedTargets,
    };
  } catch {
    return { ...defaultFloatTargets };
  }
}

export function saveFloatTargets(targets) {
  localStorage.setItem(
    FLOAT_TARGETS_STORAGE_KEY,
    JSON.stringify(targets),
  );
}

export function clearSavedFloatTargets() {
  localStorage.removeItem(FLOAT_TARGETS_STORAGE_KEY);
}