<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const data = ref([
  { id: 1, name: 'Nike', website: 'nike.com', logo: 'https://logo.clearbit.com/nike.com' },
  { id: 2, name: 'Adidas', website: 'adidas.com', logo: 'https://logo.clearbit.com/adidas.com' },
])

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'name', header: 'Marque',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(UAvatar, { src: row.original.logo, size: 'xs' }),
      h('span', row.original.name)
    ])
  },
  { accessorKey: 'website', header: 'Site Web', cell: ({row}) => h('a', { href: `https://${row.original.website}`, target: '_blank', class:'text-primary hover:underline' }, row.original.website) },
  {
    id: 'actions',
    cell: () => h(UDropdownMenu, { items: [[{ label: 'Modifier', icon: 'i-lucide-edit' }, { label: 'Supprimer', icon: 'i-lucide-trash', color: 'error' }]] }, () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', variant: 'ghost', color: 'neutral' }))
  }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Marques">
        <template #right>
          <UButton label="Ajouter Marque" icon="i-lucide-plus" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable :data="data" :columns="columns" />
    </template>
  </UDashboardPanel>
</template>
