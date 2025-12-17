<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const data = ref([
  { id: 1, product: 'Sac de Luxe', qr_code: 'LV-99283', generated_at: '2023-10-01', scans: 15, alerts: 0, status: 'authentic' },
  { id: 2, product: 'Montre Or', qr_code: 'RLX-112', generated_at: '2023-10-05', scans: 54, alerts: 12, status: 'flagged' },
])

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const columns: TableColumn<any>[] = [
  { accessorKey: 'product', header: 'Produit Associé' },
  { accessorKey: 'qr_code', header: 'Code QR', cell: ({row}) => h('code', { class: 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded' }, row.original.qr_code) },
  { accessorKey: 'scans', header: 'Scans' },
  { accessorKey: 'alerts', header: 'Suspects', cell: ({row}) => h('span', { class: row.original.alerts > 0 ? 'text-red-500 font-bold' : 'text-gray-500' }, row.original.alerts) },
  {
    accessorKey: 'status', header: 'État',
    cell: ({row}) => h(UBadge, { color: row.original.status === 'authentic' ? 'success' : 'error' }, () => row.original.status === 'authentic' ? 'Sûr' : 'Signalé')
  },
  {
    id: 'actions',
    cell: ({row}) => h(UButton, { label: 'Détails', variant: 'ghost', size: 'xs' })
  }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Authenticité">
        <template #right>
          <UButton label="Générer QR" icon="i-lucide-qr-code" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable :data="data" :columns="columns" />
    </template>
  </UDashboardPanel>
</template>
