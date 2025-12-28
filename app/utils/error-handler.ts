import type { ApiErrorResponse, ValidationErrors } from "~/types/validation";

/**
 * Obtient le message d'erreur d'une exception
 */
export function getErrorMessage(error: unknown): string {
  // Instance d'Error
  if (error instanceof Error) {
    return error.message;
  }

  // String directe
  if (typeof error === "string") {
    return error;
  }

  // Objet avec message
  if (error && typeof error === "object" && "message" in error) {
    const errorWithMessage = error as { message?: unknown };
    if (typeof errorWithMessage.message === "string") {
      return errorWithMessage.message;
    }
  }

  // Erreur API standard (utilise ApiErrorResponse de types/validation.ts)
  const apiError = error as ApiErrorResponse;
  if (apiError.response?._data?.message) {
    return apiError.response._data.message;
  }

  return "Une erreur inconnue est survenue.";
}

/**
 * Obtient les erreurs de validation de l'API
 */
export function getValidationErrors(error: unknown): ValidationErrors | null {
  const apiError = error as ApiErrorResponse;
  return apiError.response?._data?.errors || null;
}

/**
 * Formate les erreurs pour l'affichage (une ligne par erreur)
 */
export function formatValidationErrors(
  errors: ValidationErrors | null
): string[] {
  if (!errors) return [];

  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((message) => `${field}: ${message}`)
  );
}

/**
 * Obtient tous les messages d'erreur sous forme de string unique
 */
export function getErrorMessages(error: unknown): string {
  const validationErrors = getValidationErrors(error);

  if (validationErrors) {
    const messages = formatValidationErrors(validationErrors);
    return messages.join("\n");
  }

  return getErrorMessage(error);
}
