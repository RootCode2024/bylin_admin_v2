<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const data = ref([
  { sku: 'TSH-001', name: 'T-Shirt Blanc', on_hand: 100, reserved: 20, available: 80 },
  { sku: 'TSH-002', name: 'T-Shirt Noir', on_hand: 50, reserved: 0, available: 50 },
])

const columns: TableColumn<any>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'name', header: 'Produit' },
  { accessorKey: 'on_hand', header: 'Physique' },
  { accessorKey: 'reserved', header: 'Réservé (Cmds)' },
  { accessorKey: 'available', header: 'Disponible', cell: ({row}) => h('span', { class: 'font-bold text-primary' }, row.original.available) },
]
</script>
<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Inventaire Global" />
    <UTable :data="data" :columns="columns" />
  </UDashboardPanel>
</template>
