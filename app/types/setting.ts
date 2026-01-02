import type { User } from "~/stores/auth";

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type MemberRole = "admin" | "super_admin" | "manager";
export type MemberStatus = "active" | "inactive" | "invited" | "suspended";

export interface Member {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: MemberRole;
  status: MemberStatus;
  avatar_url?: string | null;
  phone?: string | null;
  last_login_at?: string | null;
  email_verified_at?: string | null;
  invited_at?: string | null;
  invited_by_id?: string | null;
  invited_by?: Pick<User, "id" | "name" | "email" | "avatar_url"> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations
  permissions?: Permission[];
  roles?: {
    id: string;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
  }[];

  // Computed
  initials?: string;
  is_online?: boolean;
}


export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string;
  module: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
  is_default: boolean;
  permissions_count?: number;
  members_count?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FILTRES ET PAGINATION
// ============================================================================

export interface MemberFilters {
  search?: string;
  role?: MemberRole | "all";
  status?: MemberStatus | "all";
  invited_by?: string;
  per_page?: number;
  page?: number;
  sort_by?: "name" | "email" | "role" | "created_at" | "last_login_at";
  sort_direction?: "asc" | "desc";
}

// ============================================================================
// FORMULAIRES
// ============================================================================

export interface CreateMemberInput {
  name: string;
  email: string;
  username: string;
  role: MemberRole;
  phone?: string;
  password?: string;
  send_invitation?: boolean;
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
  username?: string;
  role?: MemberRole;
  phone?: string;
  status?: MemberStatus;
}

export interface InviteMemberInput {
  email: string;
  name?: string;
  role: MemberRole;
  message?: string;
}

export interface BulkInviteMemberInput {
  invitations: InviteMemberInput[];
}

export interface UpdateMemberRoleInput {
  role: MemberRole;
}

export interface UpdateMemberStatusInput {
  status: MemberStatus;
  reason?: string;
}

// ============================================================================
// STATISTIQUES
// ============================================================================

export interface MemberStatistics {
  total_members: number;
  active_members: number;
  inactive_members: number;
  invited_members: number;
  suspended_members: number;

  // Par rôle
  admins_count: number;
  managers_count: number;

  // Activité
  online_now: number;
  logged_in_today: number;
  logged_in_this_week: number;
  logged_in_this_month: number;

  // Invitations
  pending_invitations: number;
  accepted_invitations: number;
  expired_invitations: number;

  // Croissance
  new_this_week: number;
  new_this_month: number;
}

// ============================================================================
// ACTIVITÉ
// ============================================================================

export interface MemberActivity {
  id: string;
  member_id: string;
  member?: Member;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface MemberActivityFilters {
  member_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

// ============================================================================
// INVITATIONS
// ============================================================================

export interface Invitation {
  id: string;
  email: string;
  name?: string;
  role: MemberRole;
  token: string;
  message?: string;
  invited_by_id: string;
  invited_by?: User;
  accepted_at?: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;

  // Computed
  is_expired?: boolean;
  is_accepted?: boolean;
  days_until_expiry?: number;
}

// ============================================================================
// PERMISSIONS ET RÔLES
// ============================================================================

export interface UpdateRolePermissionsInput {
  permission_ids: string[];
}

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  level: number;
  permission_ids: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  level?: number;
}

// ============================================================================
// RÉPONSES API
// ============================================================================

export interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

// ============================================================================
// CONSTANTES
// ============================================================================

export const MEMBER_ROLES: Record<MemberRole, string> = {
  admin: "Administrateur",
  super_admin: "Super Administrateur",
  manager: "Gestionnaire",
};

export const MEMBER_STATUSES: Record<MemberStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  invited: "Invité",
  suspended: "Suspendu",
};

export const ROLE_COLORS = {
  admin: "warning",
  manager: "info",
  super_admin: "error",
} as const;

export const STATUS_COLORS = {
  active: "success",
  inactive: "neutral",
  invited: "warning",
  suspended: "error",
} as const;

export const ROLE_ICONS = {
  admin: "i-lucide-shield",
  super_admin: "i-lucide-shield-check",
  manager: "i-lucide-briefcase",
} as const;

export const STATUS_ICONS = {
  active: "i-lucide-check-circle",
  inactive: "i-lucide-circle",
  invited: "i-lucide-mail",
  suspended: "i-lucide-alert-circle",
} as const;
