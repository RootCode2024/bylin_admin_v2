// test/validation.spec.ts
import { describe, it, expect } from "vitest";
import {
  phoneSchema,
  emailSchema,
  dateOfBirthSchema,
} from "~/utils/validation";

describe("Validation téléphone", () => {
  it("valide un numéro béninois", async () => {
    const result = await phoneSchema.parseAsync({
      countryCode: "BJ",
      number: "97123456",
    });
    expect(result).toBeDefined();
  });

  it("rejette un numéro invalide", async () => {
    await expect(
      phoneSchema.parseAsync({
        countryCode: "BJ",
        number: "123",
      })
    ).rejects.toThrow();
  });
});

describe("Validation email", () => {
  it("accepte un email valide", async () => {
    const result = await emailSchema.parseAsync("user@example.com");
    expect(result).toBe("user@example.com");
  });

  it("rejette un email temporaire", async () => {
    await expect(emailSchema.parseAsync("user@tempmail.com")).rejects.toThrow();
  });
});

describe("Validation date de naissance", () => {
  it("accepte un utilisateur de 13 ans", async () => {
    const thirteenYearsAgo = new Date();
    thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);

    const result = await dateOfBirthSchema.parseAsync(
      thirteenYearsAgo.toISOString().split("T")[0]
    );
    expect(result).toBeDefined();
  });

  it("rejette un utilisateur de moins de 13 ans", async () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    await expect(
      dateOfBirthSchema.parseAsync(tenYearsAgo.toISOString().split("T")[0])
    ).rejects.toThrow();
  });
});
