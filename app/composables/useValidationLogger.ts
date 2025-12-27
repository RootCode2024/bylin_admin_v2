export function useValidationLogger() {
  const logValidationErrors = (errors: any) => {
    console.group("🔄 Erreurs de Validation");

    Object.keys(errors).forEach((field) => {
      const errorMessages = errors[field];
      console.log(`❌ ${field}:`, errorMessages);

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

  return {
    logValidationErrors,
    formatFieldName,
  };
}
