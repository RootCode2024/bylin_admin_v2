<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const data = ref([
  { id: 1, name: 'Vêtements', slug: 'vetements', count: 45 },
  { id: 2, name: 'Chaussures', slug: 'chaussures', count: 12 },
])

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const columns: TableColumn<any>[] = [
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'count', header: 'Produits', cell: ({row}) => h('span', {}, `${row.original.count} articles`) },
  {
    id: 'actions',
    cell: () => h(UDropdownMenu, {
      items: [[{ label: 'Modifier', icon: 'i-lucide-edit' }, { label: 'Supprimer', icon: 'i-lucide-trash', color: 'error' }]]
    }, () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', variant: 'ghost', color: 'neutral' }))
  }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Catégories">
        <template #right>
          <UButton label="Nouvelle Catégorie" icon="i-lucide-plus" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable :data="data" :columns="columns" />
    </template>
  </UDashboardPanel>
</template>
