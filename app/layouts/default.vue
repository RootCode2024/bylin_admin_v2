<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const { stats, fetchStats } = useDashboard()

const open = ref(false)

// Fonction utilitaire pour fermer le menu mobile au clic
const closeMenu = () => {
  open.value = false
}

// Utilise computed pour la réactivité
const links = computed(() => [
  // GROUPE 1 : PRINCIPAL & VENTES
  [{
    label: 'Tableau de bord',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
    onSelect: closeMenu
  }, {
    label: 'Commandes',
    icon: 'i-lucide-shopping-bag',
    to: '/orders',
    badge: stats.value.orders > 0 ? stats.value.orders.toString() : undefined,
    onSelect: closeMenu
  }, {
    label: 'Clients',
    icon: 'i-lucide-users',
    to: '/customers',
    badge: stats.value.customers > 0 ? stats.value.customers.toString() : undefined,
    onSelect: closeMenu
  }],

  // GROUPE 2 : CATALOGUE & PRODUITS
  [{
    label: 'Catalogue',
    icon: 'i-lucide-tag',
    defaultOpen: true,
    type: 'trigger',
    children: [{
      label: 'Produits',
      to: '/products',
      exact: true,
      onSelect: closeMenu
    }, {
      label: 'Catégories',
      to: '/products/categories',
      onSelect: closeMenu
    }, {
      label: 'Marques',
      to: '/products/brands',
      onSelect: closeMenu
    }, {
      label: 'Attributs & Variantes',
      to: '/products/attributes',
      onSelect: closeMenu
    }, {
      label: 'Authenticité & QR',
      to: '/products/authenticity',
      onSelect: closeMenu
    }, {
      label: 'Précommandes',
      to: '/products/preorders',
      onSelect: closeMenu
    }]
  }, {
    label: 'Inventaire',
    icon: 'i-lucide-boxes',
    to: '/inventory',
    children: [{
      label: 'État du stock',
      to: '/inventory',
      onSelect: closeMenu
    }, {
      label: 'Mouvements',
      to: '/inventory/movements',
      onSelect: closeMenu
    }, {
      label: 'Stock faible',
      to: '/inventory/low-stock',
      onSelect: closeMenu
    }]
  }],

  // GROUPE 3 : MARKETING & FEEDBACK
  [{
    label: 'Promotions',
    icon: 'i-lucide-percent',
    to: '/promotions',
    onSelect: closeMenu
  }, {
    label: 'Avis Clients',
    icon: 'i-lucide-star',
    to: '/reviews',
    badge: stats.value.reviews > 0 ? stats.value.reviews.toString() : undefined,
    onSelect: closeMenu
  }],

  // GROUPE 4 : ADMINISTRATION & CONFIGURATION
  [{
    label: 'Livraison',
    icon: 'i-lucide-truck',
    to: '/shipping',
    onSelect: closeMenu
  }, {
    label: 'Équipe',
    icon: 'i-lucide-shield-check',
    to: '/settings/members',
    children: [{
      label: 'Membres',
      description: 'Admins & Managers',
      to: '/settings/members',
      onSelect: closeMenu
    }, {
      label: 'Rôles & Permissions',
      to: '/settings/roles',
      onSelect: closeMenu
    }]
  }, {
    label: 'Paramètres',
    icon: 'i-lucide-settings',
    to: '/settings',
    onSelect: closeMenu
  }]
] satisfies NavigationMenuItem[][])

// Helper pour vérifier si un item a des enfants
const hasChildren = (item: any): item is { children: NavigationMenuItem[] } => {
  return 'children' in item && Array.isArray(item.children)
}

// Mise à jour de la recherche
const groups = computed(() => [{
  id: 'links',
  label: 'Navigation',
  items: links.value.flat().flatMap(item => {
    return hasChildren(item) ? item.children : [item]
  })
}])

// Charger les stats au montage
onMounted(async () => {
  // Charger les statistiques pour les badges
  await fetchStats()

  // Gestion du cookie
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') return

  toast.add({
    title: 'Nous utilisons des cookies pour améliorer votre expérience.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accepter',
      color: 'neutral',
      variant: 'outline',
      onClick: () => { cookie.value = 'accepted' }
    }, {
      label: 'Refuser',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar id="default" v-model:open="open" collapsible resizable class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }">
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <div class="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          <UNavigationMenu v-for="(group, index) in links" :key="index" :collapsed="collapsed" :items="group"
            orientation="vertical" tooltip popover />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
}
</style>
