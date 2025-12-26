export interface SpatieMedia {
  id: number;
  model_type: string;
  model_id: string;
  uuid: string;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  conversions_disk: string;
  size: number;
  manipulations: Record<string, unknown>;
  custom_properties: Record<string, unknown>;
  generated_conversions: Record<string, boolean>;
  responsive_images: Record<string, unknown>;
  order_column: number;
  created_at: string;
  updated_at: string;
  original_url: string;
  preview_url: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  is_active: boolean;
  sort_order: number;
  meta_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  logo_url?: string | null;
  media?: SpatieMedia[];

  products_count?: number;
  active_products_count?: number;
}

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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface BrandStatistics {
  total: number;
  active: number;
  inactive: number;
  with_products: number;
  trashed: number;
}

export interface BrandFormData {
  name: string;
  description?: string;
  logo?: File | null;
  website?: string;
  is_active: boolean;
  sort_order?: number;
  meta_data?: Record<string, unknown>;
  remove_logo?: boolean;
}

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

export interface BrandBulkOperation {
  ids: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface BrandState {
  brands: Brand[];
  currentBrand: Brand | null;
  statistics: BrandStatistics | null;
  loading: LoadingState;
  error: string | null;
  filters: BrandFilters;
  pagination: LaravelPaginator<Brand> | null;
}

export interface ImageUploadConfig {
  maxFileSize: number;
  minDimensions: { width: number; height: number };
  maxDimensions: { width: number; height: number };
  acceptedTypes: string[];
}

export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxFileSize: 2 * 1024 * 1024,
  minDimensions: { width: 100, height: 100 },
  maxDimensions: { width: 2048, height: 2048 },
  acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

export function isApiError(response: unknown): response is ApiResponse<null> {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === false
  );
}

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

export function buildWebsiteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}

export interface BrandEvents {
  created: [];
  updated: [brand: Brand];
  deleted: [id: string];
  restored: [brand: Brand];
}

export interface BrandUIFilters {
  search: string;
  status: "all" | "active" | "inactive";
  onlyTrashed: boolean;
  withTrashed: boolean;
}
