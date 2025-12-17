<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
const data = ref([
  { code: 'SUMMER20', discount: '20%', usage: 154, status: 'active', end_date: '2024-08-31' },
  { code: 'WELCOME', discount: '10€', usage: 1200, status: 'active', end_date: 'Permanent' },
])
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const columns: TableColumn<any>[] = [
  { accessorKey: 'code', header: 'Code Promo', cell: ({row}) => h('code', { class: 'font-bold text-primary' }, row.original.code) },
  { accessorKey: 'discount', header: 'Réduction' },
  { accessorKey: 'usage', header: 'Utilisations' },
  { accessorKey: 'end_date', header: 'Expiration' },
  { accessorKey: 'status', header: 'Statut', cell: ({row}) => h(UBadge, { color: 'success' }, () => 'Actif') },
  { id: 'actions', cell: () => h(UDropdownMenu, { items: [[{ label: 'Désactiver' }]] }, () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', variant: 'ghost' })) }
]
</script>
<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Codes Promo">
        <template #right><UButton icon="i-lucide-plus" label="Créer" /></template>
    </UDashboardNavbar>
    <UTable :data="data" :columns="columns" />
  </UDashboardPanel>
</template>
