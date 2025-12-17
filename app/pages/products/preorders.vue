<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
const data = ref([
  { id: 1, product: 'Console NextGen', release_date: '2024-12-01', orders_count: 540, status: 'open' },
])
const UBadge = resolveComponent('UBadge')
const columns: TableColumn<any>[] = [
  { accessorKey: 'product', header: 'Produit' },
  { accessorKey: 'release_date', header: 'Date de Sortie' },
  { accessorKey: 'orders_count', header: 'Commandes' },
  { accessorKey: 'status', header: 'Statut', cell: ({row}) => h(UBadge, { color: 'primary' }, () => 'Ouvert') }
]
</script>
<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Précommandes" />
    <UTable :data="data" :columns="columns" />
  </UDashboardPanel>
</template>
