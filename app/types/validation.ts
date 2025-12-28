/**
 * Type pour les erreurs de validation retournées par l'API
 */
export interface ValidationErrors {
  [field: string]: string[];
}

/**
 * Type pour les erreurs API génériques
 */
export interface ApiError {
  message?: string;
  errors?: ValidationErrors;
}

/**
 * Type pour les réponses d'erreur de l'API
 */
export interface ApiErrorResponse {
  response?: {
    _data?: ApiError;
  };
  message?: string;
}
