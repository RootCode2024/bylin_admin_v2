/**
 * Types pour le module Catalogue - Attributs
 *
 * Ce fichier contient toutes les interfaces et types TypeScript
 * utilisés pour la gestion des attributs et leurs valeurs dans l'application.
 */

/**
 * Interface représentant un attribut (Couleur, Taille, etc.)
 */
export interface Attribute {
  id: string;
  name: string;
  code: string;
  type: AttributeType;
  is_filterable: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations optionnelles
  values?: AttributeValue[];
  values_count?: number;
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  label: string;
  color_code?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  attribute?: Attribute;
}

export type AttributeType = "text" | "select" | "color" | "size" | "boolean";

/**
 * Interface pour la pagination Laravel
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

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

/**
 * Interface générique pour les réponses API
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

/**
 * Interface pour les statistiques des attributs
 */
export interface AttributeStatistics {
  total: number;
  by_type: Record<AttributeType, number>;
  filterable: number;
  with_products: number;
  trashed: number;
}

/**
 * Interface pour les données de formulaire d'attribut
 */
export interface AttributeFormData {
  name: string;
  code?: string;
  type: AttributeType;
  is_filterable?: boolean;
  sort_order?: number;
  values?: AttributeValueFormData[];
}

/**
 * Interface pour les données de formulaire de valeur d'attribut
 */
export interface AttributeValueFormData {
  id?: string;
  value: string;
  label?: string;
  color_code?: string;
  sort_order?: number;
}

/**
 * Paramètres de filtrage et recherche pour attributs
 */
export interface AttributeFilters {
  search?: string;
  type?: AttributeType | "all";
  is_filterable?: boolean;
  only_trashed?: boolean;
  with_trashed?: boolean;
  with_values?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: "name" | "code" | "type" | "sort_order" | "created_at";
  sort_direction?: "asc" | "desc";
}

/**
 * Paramètres de filtrage pour valeurs d'attributs
 */
export interface AttributeValueFilters {
  search?: string;
  attribute_id?: string;
  per_page?: number;
  page?: number;
}

/**
 * Type pour les opérations en masse
 */
export interface BulkOperation {
  ids: string[];
}

/**
 * Type union pour les statuts de chargement
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Interface pour la gestion d'état du composable
 */
export interface AttributeState {
  attributes: Attribute[];
  currentAttribute: Attribute | null;
  statistics: AttributeStatistics | null;
  loading: LoadingState;
  error: string | null;
  filters: AttributeFilters;
  pagination: LaravelPaginator<Attribute> | null;
}

/**
 * Labels des types d'attributs
 */
export const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  text: "Texte",
  select: "Sélection",
  color: "Couleur",
  size: "Taille",
  boolean: "Oui/Non",
};

/**
 * Icônes des types d'attributs
 */
export const ATTRIBUTE_TYPE_ICONS: Record<AttributeType, string> = {
  text: "i-lucide-text",
  select: "i-lucide-list",
  color: "i-lucide-palette",
  size: "i-lucide-ruler",
  boolean: "i-lucide-toggle-left",
};

/**
 * Couleurs des badges de types
 */
export const ATTRIBUTE_TYPE_COLORS: Record<AttributeType, string> = {
  text: "neutral",
  select: "primary",
  color: "secondary",
  size: "success",
  boolean: "warning",
};

/**
 * Filtres pour l'interface utilisateur
 */
export interface AttributeUIFilters {
  search: string;
  type: AttributeType | "all";
  filterableOnly: boolean;
  onlyTrashed: boolean;
}

/**
 * Interface pour les événements émis
 */
export interface AttributeEvents {
  created: [];
  updated: [attribute: Attribute];
  deleted: [id: string];
  restored: [attribute: Attribute];
}

/**
 * Interface pour l'ordre de tri des valeurs
 */
export interface ValueReorderData {
  orders: Array<{
    id: string;
    sort_order: number;
  }>;
}
