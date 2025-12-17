<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
const data = ref([
  { date: '2023-11-01 10:00', type: 'in', quantity: 50, reason: 'Réception Fournisseur', user: 'Admin' },
  { date: '2023-11-01 14:30', type: 'out', quantity: 2, reason: 'Commande #1001', user: 'System' },
])
const UBadge = resolveComponent('UBadge')
const columns: TableColumn<any>[] = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'type', header: 'Type', cell: ({row}) => h(UBadge, { color: row.original.type === 'in' ? 'success' : 'warning', variant: 'subtle' }, () => row.original.type === 'in' ? 'Entrée' : 'Sortie') },
  { accessorKey: 'quantity', header: 'Quantité', cell: ({row}) => h('span', {}, (row.original.type === 'out' ? '-' : '+') + row.original.quantity) },
  { accessorKey: 'reason', header: 'Raison' },
]
</script>
<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Mouvements de Stock" />
    <UTable :data="data" :columns="columns" />
  </UDashboardPanel>
</template>
