import { createSharedComposable } from '@vueuse/core'

interface DashboardStats {
  customers: number;
  orders: number;
  products: number;
  reviews: number;
}

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()
  const client = useSanctumClient()

  const isNotificationsSlideoverOpen = ref(false)

  // État des statistiques avec cache
  const stats = useState<DashboardStats>("dashboard:stats", () => ({
    customers: 0,
    orders: 0,
    products: 0,
    reviews: 0,
  }))

  const statsLoading = useState<boolean>("dashboard:stats:loading", () => false)
  const lastStatsFetch = useState<number>("dashboard:stats:timestamp", () => 0)

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-i': () => router.push('/inbox'),
    'g-c': () => router.push('/customers'),
    'g-s': () => router.push('/settings'),
    'n': () => isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
  })

  watch(() => route.fullPath, () => {
    isNotificationsSlideoverOpen.value = false
  })

  /**
   * Récupère les statistiques du dashboard
   * Cache de 5 minutes pour éviter les appels répétés
   */
  async function fetchStats(force = false) {
    const now = Date.now()
    const cacheExpiry = 5 * 60 * 1000 // 5 minutes

    // Utilise le cache si disponible et récent
    if (!force && stats.value.customers > 0 && now - lastStatsFetch.value < cacheExpiry) {
      return stats.value
    }

    statsLoading.value = true

    try {
      const response = await client<{
        success: boolean;
        data: DashboardStats;
      }>("/api/v1/admin/dashboard/stats")

      if (response.success) {
        stats.value = response.data
        lastStatsFetch.value = now
      }

      return stats.value
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error)
      return stats.value // Retourne les stats en cache en cas d'erreur
    } finally {
      statsLoading.value = false
    }
  }

  /**
   * Force le rafraîchissement des stats
   */
  function refreshStats() {
    return fetchStats(true)
  }

  /**
   * Invalide le cache (à appeler après création/suppression)
   */
  function invalidateStatsCache() {
    lastStatsFetch.value = 0
  }

  return {
    isNotificationsSlideoverOpen,
    stats: readonly(stats),
    statsLoading: readonly(statsLoading),
    fetchStats,
    refreshStats,
    invalidateStatsCache
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
