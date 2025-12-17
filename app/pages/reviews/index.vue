<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
const data = ref([
  { id: 1, product: 'T-Shirt Basique', customer: 'Alice', rating: 5, comment: 'Super qualité !', status: 'pending' },
])
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const columns: TableColumn<any>[] = [
  { accessorKey: 'product', header: 'Produit' },
  { accessorKey: 'rating', header: 'Note', cell: ({row}) => h('div', { class: 'flex text-yellow-500' }, Array(row.original.rating).fill('★').join('')) },
  { accessorKey: 'comment', header: 'Commentaire', cell: ({row}) => h('span', { class: 'italic text-gray-500 truncate max-w-xs block' }, row.original.comment) },
  { accessorKey: 'status', header: 'Statut', cell: ({row}) => h(UBadge, { color: 'warning', variant: 'subtle' }, () => 'En attente') },
  { id: 'actions', cell: () => h('div', { class: 'flex gap-2' }, [
      h(UButton, { icon: 'i-lucide-check', color: 'success', size: 'xs', variant: 'soft' }),
      h(UButton, { icon: 'i-lucide-x', color: 'error', size: 'xs', variant: 'soft' })
  ]) }
]
</script>
<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Avis Clients" />
    <UTable :data="data" :columns="columns" />
  </UDashboardPanel>
</template>
