/**
 * Types pour le module Promotion
 *
 * Ce fichier contient toutes les interfaces et types TypeScript
 * utilisés pour la gestion des promotions et codes promo.
 */

import type { Customer } from "./customer";

/**
 * Interface représentant une promotion
 */
export interface Promotion {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  type: PromotionType;
  value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number;
  usage_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  applicable_products: string[] | null;
  applicable_categories: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relations optionnelles
  usages?: PromotionUsage[];
  usages_count?: number;
}

/**
 * Interface représentant une utilisation de promotion
 */
export interface PromotionUsage {
  id: string;
  promotion_id: string;
  customer_id: string | null;
  order_id: string | null;
  discount_amount: number;
  created_at: string;
  updated_at: string;

  promotion?: Promotion;
  customer?: Customer;
  order?: any; // Type Order à définir selon votre modèle
}

/**
 * Types de promotions disponibles
 */
export type PromotionType = "percentage" | "fixed_amount" | "buy_x_get_y";

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
 * Interface pour les statistiques des promotions
 */
export interface PromotionStatistics {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  upcoming: number;
  by_type: Record<PromotionType, number>;
  total_usage: number;
  total_discount_amount: number;
}

/**
 * Interface pour les données de formulaire de promotion
 */
export interface PromotionFormData {
  name: string;
  code?: string | null;
  description?: string;
  type: PromotionType;
  value: number;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  usage_limit_per_customer?: number;
  is_active?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  applicable_products?: string[] | null;
  applicable_categories?: string[] | null;
  metadata?: Record<string, unknown>;
}

/**
 * Paramètres de filtrage et recherche pour promotions
 */
export interface PromotionFilters {
  search?: string;
  type?: PromotionType | "all";
  status?: "all" | "active" | "inactive" | "expired" | "upcoming";
  only_trashed?: boolean;
  with_trashed?: boolean;
  per_page?: number;
  page?: number;
  sort_by?:
    | "name"
    | "code"
    | "value"
    | "usage_count"
    | "starts_at"
    | "expires_at"
    | "created_at";
  sort_direction?: "asc" | "desc";
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
export interface PromotionState {
  promotions: Promotion[];
  currentPromotion: Promotion | null;
  statistics: PromotionStatistics | null;
  loading: LoadingState;
  error: string | null;
  filters: PromotionFilters;
  pagination: LaravelPaginator<Promotion> | null;
}

/**
 * Labels des types de promotions
 */
export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  percentage: "Pourcentage",
  fixed_amount: "Montant fixe",
  buy_x_get_y: "Achetez X obtenez Y",
};

/**
 * Icônes des types de promotions
 */
export const PROMOTION_TYPE_ICONS: Record<PromotionType, string> = {
  percentage: "i-lucide-percent",
  fixed_amount: "i-lucide-coins",
  buy_x_get_y: "i-lucide-gift",
};

/**
 * Couleurs des badges de types
 */
export const PROMOTION_TYPE_COLORS: Record<PromotionType, string> = {
  percentage: "primary",
  fixed_amount: "success",
  buy_x_get_y: "secondary",
};

/**
 * Statuts de promotion
 */
export type PromotionStatus =
  | "active"
  | "inactive"
  | "expired"
  | "upcoming"
  | "exhausted";

/**
 * Labels des statuts
 */
export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expirée",
  upcoming: "À venir",
  exhausted: "Épuisée",
};

/**
 * Couleurs des statuts
 */
export const PROMOTION_STATUS_COLORS: Record<PromotionStatus, string> = {
  active: "success",
  inactive: "neutral",
  expired: "error",
  upcoming: "info",
  exhausted: "warning",
};

/**
 * Filtres pour l'interface utilisateur
 */
export interface PromotionUIFilters {
  search: string;
  type: PromotionType | "all";
  status: "all" | "active" | "inactive" | "expired" | "upcoming";
  onlyTrashed: boolean;
}

/**
 * Interface pour les événements émis
 */
export interface PromotionEvents {
  created: [];
  updated: [promotion: Promotion];
  deleted: [id: string];
  restored: [promotion: Promotion];
  activated: [promotion: Promotion];
  deactivated: [promotion: Promotion];
}

/**
 * Interface pour la validation de coupon
 */
export interface CouponValidation {
  valid: boolean;
  promotion?: Promotion;
  discount_amount?: number;
  error?: string;
}
