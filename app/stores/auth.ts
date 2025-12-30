import { defineStore } from "pinia";

export interface User {
  id: number;
  name: string;
  email: string;
  roles?: string[];
  avatar?: string;
  avatar_url?: string;
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
  const user = computed(() => sanctumUser.value as User | null);
  const isAuthenticated = computed(() => !!sanctumUser.value);

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
