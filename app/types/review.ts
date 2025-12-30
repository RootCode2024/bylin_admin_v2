/**
 * Types pour le module Reviews
 * Gestion des avis clients et modération
 */

import type { Product } from "./product";
import type { Customer } from "./customer";

// ==========================================
// ENUMS & TYPES DE BASE
// ==========================================

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewMediaType = "image" | "video";

// ==========================================
// ENTITÉS PRINCIPALES
// ==========================================

export interface ReviewMedia {
  id: string;
  review_id: string;
  media_type: ReviewMediaType;
  media_path: string;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  order_id?: string | null;

  // Contenu
  rating: number; // 1-5
  title?: string | null;
  comment?: string | null;

  // Statut
  status: ReviewStatus;
  is_verified_purchase: boolean;
  helpful_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations (Eager Loading)
  product?: Product;
  customer?: Customer;
  media?: ReviewMedia[];
  media_count?: number;
}

// ==========================================
// API & PAGINATION
// ==========================================

export interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

// ==========================================
// STATISTIQUES & FILTRES
// ==========================================

export interface ReviewStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  verified_purchases: number;
  with_media: number;
  by_rating: Record<number, number>;
  average_rating: number;
  recent_reviews: Review[];
}

export interface ReviewFilters {
  search?: string;
  status?: ReviewStatus | "all";
  rating?: number;
  verified_only?: boolean;
  product_id?: string;
  customer_id?: string;
  with_trashed?: boolean;
  only_trashed?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: "created_at" | "rating" | "helpful_count" | "status";
  sort_direction?: "asc" | "desc";
}

// ==========================================
// ÉTAT & LOADING
// ==========================================

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface ReviewState {
  reviews: Review[];
  currentReview: Review | null;
  statistics: ReviewStatistics | null;
  loadingState: LoadingState;
  error: string | null;
  pagination: LaravelPaginator<Review> | null;
  filters: ReviewFilters;
}
