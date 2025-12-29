import { describe, it, expect, vi, beforeEach } from "vitest";
import { useValidationLogger } from "~/composables/useValidationLogger";

describe("useValidationLogger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne null si aucune erreur", () => {
    const { getErrorMessage } = useValidationLogger();

    const result = getErrorMessage(null, "name");
    expect(result).toBeNull();
  });

  it("récupère le premier message d’erreur", () => {
    const { getErrorMessage } = useValidationLogger();

    const errors = {
      name: ["Champ requis", "Trop court"],
    };

    expect(getErrorMessage(errors, "name")).toBe("Champ requis");
  });

  it("formate les erreurs pour l’UI", () => {
    const { formatErrorsForUI } = useValidationLogger();

    const errors = {
      name: ["Champ requis", "Trop court"],
      price: "Invalide",
    };

    const formatted = formatErrorsForUI(errors);

    expect(formatted).toEqual({
      name: "Champ requis, Trop court",
      price: "Invalide",
    });
  });

  it("formate correctement un champ de variation", () => {
    const { formatFieldName } = useValidationLogger();

    const result = formatFieldName("variations.0.price");
    expect(result).toBe("Variation 1 - Prix de la variation");
  });

  it("logValidationErrors affiche un warning si null", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { logValidationErrors } = useValidationLogger();
    logValidationErrors(null);

    expect(warnSpy).toHaveBeenCalled();
  });

  it("logValidationErrors log les erreurs sans crasher", () => {
    vi.spyOn(console, "group").mockImplementation(() => {});
    vi.spyOn(console, "groupEnd").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { logValidationErrors } = useValidationLogger();

    logValidationErrors({
      "variations.1.stock_quantity": "Stock insuffisant",
    });

    expect(console.log).toHaveBeenCalled();
  });
});
