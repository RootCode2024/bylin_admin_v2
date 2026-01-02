import { defineStore } from "pinia";
import type { Permission } from "~/types/setting";

export type UserStatus = "active" | "inactive" | "suspended" | "banned";

export interface UserRole {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Permission[];
  pivot?: {
    model_id: string;
    model_type: string;
    role_id: number;
  };
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string; // UUID
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  status: UserStatus;

  // Avatar
  avatar?: string | null;
  avatar_url?: string | null;

  // Spatie Permissions
  roles?: UserRole[];
  permissions?: Permission[];

  // Timestamps
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations
  invited_by_id?: string | null;
  invited_at?: string | null;
}

interface LoginCredentials extends Record<string, unknown> {
  email: string;
  password: string;
  remember?: boolean;
}

export const useAuthStore = defineStore("auth", () => {
  const {
    user: sanctumUser,
    login: sanctumLogin,
    logout: sanctumLogout,
    refreshIdentity,
  } = useSanctumAuth();
  const loading = ref(false);

  // Getters
  const user = computed(() => {
    return sanctumUser.value as User | null;
  });

  const isAuthenticated = computed(() => !!user.value);

  // Actions
  async function login(credentials: LoginCredentials) {
    loading.value = true;
    try {
      await sanctumLogin(credentials);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erreur lors de la connexion", error.message);
      } else {
        console.error("Erreur inconnue", error);
      }
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    try {
      await sanctumLogout();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erreur lors de la déconnexion", error.message);
      } else {
        console.error("Erreur inconnue", error);
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshIdentity,
  };
});
