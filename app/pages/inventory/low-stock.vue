<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
const data = ref([
  { product: 'Sneakers Pro (42)', current: 2, min: 5, supplier: 'Nike Inc.' },
])
const UButton = resolveComponent('UButton')
const columns: TableColumn<any>[] = [
  { accessorKey: 'product', header: 'Produit' },
  { accessorKey: 'current', header: 'Stock Actuel', cell: ({row}) => h('span', { class: 'text-red-500 font-bold' }, row.original.current) },
  { accessorKey: 'min', header: 'Seuil Min.' },
  { accessorKey: 'supplier', header: 'Fournisseur' },
  { id: 'actions', cell: () => h(UButton, { label: 'Commander', size: 'xs', icon: 'i-lucide-shopping-cart' }) }
]
</script>
<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Alertes Stock Faible">
        <template #right>
            <UButton label="Commander tout" color="warning" />
        </template>
    </UDashboardNavbar>
    <UTable :data="data" :columns="columns" />
  </UDashboardPanel>
</template>
