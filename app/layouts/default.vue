<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

// Fonction utilitaire pour fermer le menu mobile au clic
const closeMenu = () => {
  open.value = false
}

const links = [
  // GROUPE 1 : PRINCIPAL & VENTES
  [{
    label: 'Tableau de bord',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
    onSelect: closeMenu
  }, {
    label: 'Commandes',
    icon: 'i-lucide-shopping-bag', // Correspond à apiResource('orders')
    to: '/orders',
    badge: '2', // À dynamiser plus tard avec le backend
    onSelect: closeMenu
  }, {
    label: 'Clients',
    icon: 'i-lucide-users', // Correspond à apiResource('customers')
    to: '/customers',
    onSelect: closeMenu
  }],

  // GROUPE 2 : CATALOGUE & PRODUITS
  [{
    label: 'Catalogue',
    icon: 'i-lucide-tag',
    defaultOpen: true,
    type: 'trigger', // Menu déroulant pour tout ce qui touche aux produits
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
      label: 'Authenticité & QR', // Correspond à prefix('authenticity')
      to: '/products/authenticity',
      onSelect: closeMenu
    }, {
      label: 'Précommandes', // Correspond à prefix('preorder')
      to: '/products/preorders',
      onSelect: closeMenu
    }]
  }, {
    label: 'Inventaire', // Correspond à prefix('inventory')
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
    icon: 'i-lucide-percent', // Correspond à apiResource('promotions')
    to: '/promotions',
    onSelect: closeMenu
  }, {
    label: 'Avis Clients',
    icon: 'i-lucide-star', // Correspond à apiResource('reviews')
    to: '/reviews',
    onSelect: closeMenu
  }],

  // GROUPE 4 : ADMINISTRATION & CONFIGURATION
  [{
    label: 'Livraison',
    icon: 'i-lucide-truck', // Correspond à apiResource('shipping-methods')
    to: '/shipping',
    onSelect: closeMenu
  }, {
    label: 'Équipe', // Correspond à apiResource('users') - TA DEMANDE SPÉCIFIQUE
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
] satisfies NavigationMenuItem[][]

// Mise à jour de la recherche pour inclure tous les nouveaux liens
const groups = computed(() => [{
  id: 'links',
  label: 'Navigation',
  items: links.flat().flatMap(item => {
    // Si l'item a des enfants, on les ajoute à la recherche, sinon on ajoute l'item lui-même
    return item.children ? item.children : item
  })
}])

onMounted(async () => {
  // Gestion du cookie (inchangé)
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
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <!-- Tu pourras remplacer ceci par ton Logo -->
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <!-- Boucle pour afficher les différents groupes de menu séparés par des espaces -->
        <div class="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          <UNavigationMenu
            v-for="(group, index) in links"
            :key="index"
            :collapsed="collapsed"
            :items="group"
            orientation="vertical"
            tooltip
            popover
          />
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
/* Petit fix pour le scroll dans la sidebar si le menu est très long */
.custom-scrollbar {
  scrollbar-width: thin;
}
</style>
