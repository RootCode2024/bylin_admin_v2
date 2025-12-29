import { describe, it, expect } from "vitest";
import { formatRelativeTimeFR } from "~/utils/formatRelativeTimeFR";

describe("formatRelativeTimeFR", () => {
  const baseDate = new Date("2025-01-01T12:00:00Z");

  it('retourne "maintenant" pour une date très proche', () => {
    const date = new Date(baseDate.getTime() + 2000);
    const result = formatRelativeTimeFR(date, { baseDate });
    expect(result).toBe("maintenant");
  });

  it("retourne un format en minutes", () => {
    const date = new Date(baseDate.getTime() - 60 * 1000);
    const result = formatRelativeTimeFR(date, { baseDate });
    expect(result).toContain("minute");
  });

  it("utilise le format court", () => {
    const date = new Date(baseDate.getTime() - 2 * 60 * 60 * 1000);
    const result = formatRelativeTimeFR(date, {
      baseDate,
      short: true,
    });

    expect(result).toMatch(/h|heure/);
  });

  it('respecte strict = true (pas "maintenant")', () => {
    const date = new Date(baseDate);
    const result = formatRelativeTimeFR(date, {
      baseDate,
      strict: true,
    });

    expect(result).not.toBe("maintenant");
  });

  it("respecte maxUnit", () => {
    const date = new Date(baseDate.getTime() - 40 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTimeFR(date, {
      baseDate,
      maxUnit: "day",
    });

    expect(result).toContain("jour");
  });

  it("retourne — pour une date invalide", () => {
    const result = formatRelativeTimeFR("invalid-date");
    expect(result).toBe("—");
  });
});
