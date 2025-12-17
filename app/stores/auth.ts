// stores/auth.ts
import { defineStore } from 'pinia'

// Interface utilisateur (Adapter selon la réponse de ton API /me)
interface User {
  id: number
  name: string
  email: string
  roles?: string[]
  avatar?: string
  avatar_url?: string
}

export const useAuthStore = defineStore('auth', () => {
  const { user: sanctumUser, login: sanctumLogin, logout: sanctumLogout, refreshIdentity } = useSanctumAuth()
  const loading = ref(false)

  // Getters
  const user = computed(() => sanctumUser.value as User | null)
  const isAuthenticated = computed(() => !!sanctumUser.value)

  // Actions
  async function login(credentials: Record<string, any>) {
    loading.value = true
    try {
      // Le module gère la requête et la redirection (config.redirect.onLogin)
      await sanctumLogin(credentials)
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      // Le module gère la requête et la redirection (config.redirect.onLogout)
      await sanctumLogout()
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshIdentity
  }
})
