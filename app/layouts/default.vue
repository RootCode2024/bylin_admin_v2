<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
const { stats, fetchStats } = useDashboard()

const open = ref(false)

const closeMenu = () => {
  open.value = false
}

// Type pour les items de navigation avec enfants
interface NavigationItem extends NavigationMenuItem {
  children?: NavigationItem[]
  badge?: string
  onSelect?: () => void
}

// Fonction utilitaire pour créer des items de navigation typés
const createNavigationItem = <T extends NavigationItem>(item: T): T => item

// Créer les liens avec un typage explicite
const links = computed(() => {
  const menuItems: NavigationItem[][] = [
    // GROUPE 1 : PRINCIPAL & VENTES
    [
      createNavigationItem({
        label: 'Tableau de bord',
        icon: 'i-lucide-layout-dashboard',
        to: '/',
        onSelect: closeMenu
      }),
      createNavigationItem({
        label: 'Commandes',
        icon: 'i-lucide-shopping-bag',
        to: '/orders',
        badge: stats.value.orders > 0 ? stats.value.orders.toString() : undefined,
        onSelect: closeMenu
      }),
      createNavigationItem({
        label: 'Précommandes',
        icon: 'i-lucide-shopping-bag',
        to: '/products/preorders',
        badge: stats.value.orders > 0 ? stats.value.orders.toString() : undefined,
        onSelect: closeMenu
      }),
      createNavigationItem({
        label: 'Clients',
        icon: 'i-lucide-users',
        to: '/customers',
        badge: stats.value.customers > 0 ? stats.value.customers.toString() : undefined,
        onSelect: closeMenu
      })
    ],

    // GROUPE 2 : CATALOGUE & PRODUITS
    [
      createNavigationItem({
        label: 'Catalogue',
        icon: 'i-lucide-tag',
        defaultOpen: true,
        type: 'trigger',
        children: [
          createNavigationItem({
            label: 'Produits',
            to: '/products',
            exact: true,
            badge: stats.value.products > 0 ? stats.value.products.toString() : undefined,
            onSelect: closeMenu
          }),
          createNavigationItem({
            label: 'Collections',
            to: '/products/collections',
            exact: true,
            badge: stats.value.collections > 0 ? stats.value.collections.toString() : undefined,
            onSelect: closeMenu
          }),
          createNavigationItem({
            label: 'Catégories',
            to: '/products/categories',
            badge: stats.value.categories > 0 ? stats.value.categories.toString() : undefined,
            onSelect: closeMenu
          }),
          createNavigationItem({
            label: 'Marques',
            to: '/products/brands',
            badge: stats.value.brands > 0 ? stats.value.brands.toString() : undefined,
            onSelect: closeMenu
          }),
          createNavigationItem({
            label: 'Attributs & Variantes',
            to: '/products/attributes',
            badge: stats.value.attributes > 0 ? stats.value.attributes.toString() : undefined,
            onSelect: closeMenu
          })
        ]
      }),
      createNavigationItem({
        label: 'Inventaire',
        icon: 'i-lucide-boxes',
        to: '/inventory',
        children: [
          createNavigationItem({
            label: 'État du stock',
            to: '/inventory',
            onSelect: closeMenu
          }),
          createNavigationItem({
            label: 'Mouvements',
            to: '/inventory/movements',
            onSelect: closeMenu
          })
        ]
      })
    ],

    // GROUPE 3 : MARKETING & FEEDBACK
    [
      createNavigationItem({
        label: 'Promotions',
        icon: 'i-lucide-percent',
        to: '/promotions',
        badge: stats.value.promotions > 0 ? stats.value.promotions.toString() : undefined,
        onSelect: closeMenu
      }),
      createNavigationItem({
        label: 'Avis Clients',
        icon: 'i-lucide-star',
        to: '/reviews',
        badge: stats.value.reviews > 0 ? stats.value.reviews.toString() : undefined,
        onSelect: closeMenu
      })
    ],

    // GROUPE 4 : ADMINISTRATION & CONFIGURATION
    [
      createNavigationItem({
        label: 'Livraison',
        icon: 'i-lucide-truck',
        to: '/shipping',
        onSelect: closeMenu
      }),
      createNavigationItem({
        label: 'Équipe',
        icon: 'i-lucide-shield-check',
        to: '/settings/members',
        children: [
          createNavigationItem({
            label: 'Membres',
            description: 'Admins & Managers',
            to: '/settings/members',
            onSelect: closeMenu
          }),
          createNavigationItem({
            label: 'Rôles & Permissions',
            to: '/settings/roles',
            onSelect: closeMenu
          })
        ]
      }),
      createNavigationItem({
        label: 'Paramètres',
        icon: 'i-lucide-settings',
        to: '/settings',
        onSelect: closeMenu
      })
    ]
  ]

  return menuItems
})

// Helper pour vérifier si un item a des enfants
const hasChildren = (item: NavigationItem): item is NavigationItem & Required<Pick<NavigationItem, 'children'>> => {
  return !!item.children && Array.isArray(item.children)
}

// Mise à jour de la recherche
const groups = computed(() => [{
  id: 'links',
  label: 'Navigation',
  items: links.value.flat().flatMap(item => {
    return hasChildren(item) ? item.children : [item]
  })
}])

onMounted(async () => {
  await fetchStats()
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
id="default"
v-model:open="open"
collapsible
resizable
class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }">
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <div class="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          <UNavigationMenu
v-for="(group, index) in links"
:key="index"
:collapsed="collapsed"
:items="group"
            orientation="vertical"
tooltip
popover />
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
