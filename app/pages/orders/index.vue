<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// --- Mock Data ---
const data = ref([
  { id: 'CMD-1001', customer: 'Alice Martin', date: new Date(), total: 125.50, payment: 'paid', status: 'shipped' },
  { id: 'CMD-1002', customer: 'Jean Dupont', date: new Date(Date.now() - 86400000), total: 54.00, payment: 'pending', status: 'processing' },
  { id: 'CMD-1003', customer: 'Paul Durand', date: new Date(Date.now() - 172800000), total: 230.00, payment: 'failed', status: 'cancelled' },
])

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const table = useTemplateRef('table')
const pagination = ref({ pageIndex: 0, pageSize: 10 })

const columns: TableColumn<any>[] = [
  { accessorKey: 'id', header: 'Référence', cell: ({ row }) => h('span', { class: 'font-mono font-bold' }, row.original.id) },
  { accessorKey: 'customer', header: 'Client' },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => format(row.original.date, 'dd MMM yyyy', { locale: fr })
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(row.original.total)
  },
  {
    accessorKey: 'payment',
    header: 'Paiement',
    cell: ({ row }) => {
      const map: any = { paid: { l: 'Payé', c: 'success' }, pending: { l: 'En attente', c: 'warning' }, failed: { l: 'Échoué', c: 'error' } }
      const s = map[row.original.payment]
      return h(UBadge, { color: s.c, variant: 'subtle' }, () => s.l)
    }
  },
  {
    accessorKey: 'status',
    header: 'Livraison',
    cell: ({ row }) => {
      const map: any = { shipped: { l: 'Expédié', c: 'success' }, processing: { l: 'En cours', c: 'primary' }, cancelled: { l: 'Annulée', c: 'neutral' } }
      const s = map[row.original.status]
      return h(UBadge, { color: s.c, variant: 'outline' }, () => s.l)
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => h(UDropdownMenu, {
      content: { align: 'end' },
      items: [[{ label: 'Voir commande', icon: 'i-lucide-eye', to: `/orders/${row.original.id}` }, { label: 'Facture PDF', icon: 'i-lucide-file-text' }]]
    }, () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', variant: 'ghost', color: 'neutral' }))
  }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Commandes">
        <template #right>
           <UButton label="Exporter" icon="i-lucide-download" variant="ghost" color="neutral" />
           <UButton label="Créer commande" icon="i-lucide-plus" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable ref="table" :data="data" :columns="columns" v-model:pagination="pagination" :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }" />
    </template>
  </UDashboardPanel>
</template>
