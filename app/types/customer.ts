export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | undefined;
  status: "active" | "inactive" | "suspended";
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | null;
  avatar?: string | null;
  avatar_url?: string | undefined;
  preferences?: Record<string, unknown>;
  oauth_provider?: string | null;
  oauth_provider_id?: string | null;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations (si chargées)
  addresses?: Address[];
  roles?: Role[];
}

export interface Address {
  id: string;
  customer_id: string;
  type: "shipping" | "billing";
  is_default: boolean;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
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
}

export interface CustomerStatistics {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  trashed: number;
  verified: number;
  with_oauth: number;
}
