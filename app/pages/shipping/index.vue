<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
const data = ref([
  { name: 'Standard (Colissimo)', zone: 'France', price: 4.90, delay: '2-4 jours' },
  { name: 'Express (DHL)', zone: 'Europe', price: 14.90, delay: '24h' },
])
const UButton = resolveComponent('UButton')
const columns: TableColumn<any>[] = [
  { accessorKey: 'name', header: 'Méthode' },
  { accessorKey: 'zone', header: 'Zone' },
  { accessorKey: 'price', header: 'Coût' },
  { accessorKey: 'delay', header: 'Délai' },
  { id: 'actions', cell: () => h(UButton, { icon: 'i-lucide-edit', variant: 'ghost' }) }
]
</script>
<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Méthodes de Livraison">
        <template #right><UButton icon="i-lucide-plus" label="Ajouter" /></template>
    </UDashboardNavbar>
    <UTable :data="data" :columns="columns" />
  </UDashboardPanel>
</template>
