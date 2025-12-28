import { defineStore } from 'pinia'

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
      await sanctumLogin(credentials)
    } catch (error) {
      console.error('Erreur lors de la connexion', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
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
