// Type pour les erreurs de validation
export interface ValidationError {
  [field: string]: string[] | string;
}

export function useValidationLogger() {
  const logValidationErrors = (
    errors: ValidationError | null | undefined
  ): void => {
    if (!errors) {
      console.warn("Aucune erreur de validation à logger");
      return;
    }

    console.group("Erreurs de Validation");

    Object.keys(errors).forEach((field) => {
      const errorMessages = errors[field];

      // Converti en tableau si c'est une string
      const messages = Array.isArray(errorMessages)
        ? errorMessages
        : [errorMessages];

      console.log(`${field}:`, messages.join(", "));

      // Log supplémentaire pour les variations
      if (field.includes("variations")) {
        const match = field.match(/variations\.(\d+)\.(.+)/);
        if (match) {
          const index = match[1];
          const subField = match[2];
          console.log(
            `   → Variation ${parseInt(index as string) + 1}, Champ: ${subField}`
          );
        }
      }
    });

    console.groupEnd();
  };

  const formatFieldName = (field: string): string => {
    const fieldMap: Record<string, string> = {
      name: "Nom du produit",
      brand_id: "Marque",
      categories: "Catégories",
      price: "Prix",
      "variations.*.variation_name": "Nom de la variation",
      "variations.*.price": "Prix de la variation",
      "variations.*.stock_quantity": "Stock de la variation",
      authenticity_codes_count: "Nombre de codes d'authenticité",
      stock_quantity: "Quantité en stock",
    };

    // Vérifier les variations
    const variationMatch = field.match(/variations\.(\d+)\.(.+)/);
    if (variationMatch) {
      const index = parseInt(variationMatch[1] as string) + 1;
      const subField = variationMatch[2];
      const subFieldName = fieldMap[`variations.*.${subField}`] || subField;
      return `Variation ${index} - ${subFieldName}`;
    }

    return fieldMap[field] || field;
  };

  // Helper pour formater les erreurs pour l'affichage UI
  const formatErrorsForUI = (
    errors: ValidationError | null | undefined
  ): Record<string, string> => {
    if (!errors) return {};

    const formattedErrors: Record<string, string> = {};

    Object.keys(errors).forEach((field) => {
      const errorMessages = errors[field];
      const messages = Array.isArray(errorMessages)
        ? errorMessages.join(", ")
        : errorMessages;

      formattedErrors[field] = messages as string;
    });

    return formattedErrors;
  };

  // Helper pour obtenir un message d'erreur spécifique
  const getErrorMessage = (
    errors: ValidationError | null | undefined,
    field: string
  ): string | null => {
    if (!errors || !errors[field]) return null;

    const errorMessages = errors[field];
    if (Array.isArray(errorMessages)) {
      return errorMessages[0] || null;
    }

    return errorMessages;
  };

  return {
    logValidationErrors,
    formatFieldName,
    formatErrorsForUI,
    getErrorMessage,
  };
}

// Type pour les résultats de validation
export type ValidationLogger = ReturnType<typeof useValidationLogger>;
