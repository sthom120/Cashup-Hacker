import { describe, expect, it } from "vitest";

import {
  MAX_COUNT,
  sanitiseCountInput,
} from "./countValidation";

describe("sanitiseCountInput", () => {
  it("keeps a valid whole number", () => {
    expect(sanitiseCountInput(12)).toBe(12);
  });

  it("converts numeric text", () => {
    expect(sanitiseCountInput("8")).toBe(8);
  });

  it("changes blank input to zero", () => {
    expect(sanitiseCountInput("")).toBe(0);
  });

  it("changes invalid text to zero", () => {
    expect(sanitiseCountInput("hello")).toBe(0);
  });

  it("prevents negative values", () => {
    expect(sanitiseCountInput(-5)).toBe(0);
  });

  it("removes decimal values", () => {
    expect(sanitiseCountInput(4.9)).toBe(4);
  });

  it("limits values to the maximum count", () => {
    expect(sanitiseCountInput(5000)).toBe(
      MAX_COUNT,
    );
  });
});