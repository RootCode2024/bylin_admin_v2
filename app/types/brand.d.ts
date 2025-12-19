/**
 * Types pour le module Catalogue - Marques
 *
 * Ce fichier contient toutes les interfaces et types TypeScript
 * utilisés pour la gestion des marques dans l'application.
 */

/**
 * Interface représentant une marque
 *
 * @property id - Identifiant unique de la marque (UUID)
 * @property name - Nom de la marque
 * @property slug - Slug URL-friendly généré à partir du nom
 * @property description - Description détaillée de la marque (optionnelle)
 * @property logo - Chemin relatif du fichier logo dans le storage
 * @property logo_url - URL complète du logo (générée côté backend)
 * @property website - URL du site web officiel de la marque
 * @property is_active - Indique si la marque est active et visible
 * @property sort_order - Ordre d'affichage de la marque
 * @property meta_data - Données supplémentaires au format JSON
 * @property created_at - Date de création (ISO 8601)
 * @property updated_at - Date de dernière modification (ISO 8601)
 * @property deleted_at - Date de suppression si soft-deleted (ISO 8601)
 */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  website?: string | null;
  is_active: boolean;
  sort_order: number;
  meta_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations optionnelles (chargées via eager loading)
  products_count?: number;
  active_products_count?: number;
}

/**
 * Interface pour la pagination Laravel
 *
 * Représente la structure de réponse standard de la pagination Laravel
 *
 * @template T - Type des éléments paginés
 */
export interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

/**
 * Interface représentant un lien de pagination
 */
export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

/**
 * Interface générique pour les réponses API
 *
 * Structure standard des réponses JSON de l'API Laravel
 *
 * @template T - Type des données retournées
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>; // Erreurs de validation
}

/**
 * Interface pour les statistiques des marques
 *
 * Utilisée par l'endpoint /api/brands/statistics
 */
export interface BrandStatistics {
  total: number;
  active: number;
  inactive: number;
  with_products: number;
  trashed: number;
}

/**
 * Interface pour les données de formulaire de création/modification
 *
 * Utilisée pour la validation et la soumission des formulaires
 */
export interface BrandFormData {
  name: string;
  description?: string;
  logo?: File | null;
  website?: string;
  is_active: boolean;
  sort_order?: number;
  meta_data?: Record<string, unknown>;
}

/**
 * Paramètres de filtrage et recherche pour la liste des marques
 */
export interface BrandFilters {
  search?: string;
  is_active?: boolean | string;
  only_trashed?: boolean;
  with_trashed?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: "name" | "sort_order" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

/**
 * Type pour les opérations en masse sur les marques
 */
export interface BrandBulkOperation {
  ids: string[];
}

/**
 * Type pour les erreurs de validation API
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Type union pour les statuts de chargement
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Interface pour la gestion d'état du composable useBrands
 */
export interface BrandState {
  brands: Brand[];
  currentBrand: Brand | null;
  statistics: BrandStatistics | null;
  loading: LoadingState;
  error: string | null;
  filters: BrandFilters;
  pagination: LaravelPaginator<Brand> | null;
}

/**
 * Options de configuration pour le téléchargement d'images
 */
export interface ImageUploadConfig {
  maxFileSize: number; // en octets
  minDimensions: { width: number; height: number };
  maxDimensions: { width: number; height: number };
  acceptedTypes: string[];
}

/**
 * Constantes de configuration par défaut pour les images
 */
export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  minDimensions: { width: 100, height: 100 },
  maxDimensions: { width: 2048, height: 2048 },
  acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

/**
 * Type guard pour vérifier si une réponse est une erreur
 */
export function isApiError(response: unknown): response is ApiResponse<null> {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === false
  );
}

/**
 * Helper pour formater les tailles de fichiers
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Octets";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${
    sizes[i]
  }`;
}

/**
 * Helper pour construire une URL complète de site web
 */
export function buildWebsiteUrl(domain: string, extension: string): string {
  return `https://${domain}${extension}`;
}

/**
 * Type pour les événements émis par les composants de marques
 */
export interface BrandEvents {
  created: [];
  updated: [brand: Brand];
  deleted: [id: string];
  restored: [brand: Brand];
}

/**
 * Filtres pour l'interface utilisateur (différent de BrandFilters API)
 */
export interface BrandUIFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  onlyTrashed: boolean
  withTrashed: boolean
}
