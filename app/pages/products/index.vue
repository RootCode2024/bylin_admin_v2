<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'

const data = ref([
  { id: 1, name: 'T-Shirt Basique', category: 'Vêtements', price: 19.99, stock: 150, status: 'active', image: 'https://placehold.co/50' },
  { id: 2, name: 'Sneakers Pro', category: 'Chaussures', price: 89.99, stock: 12, status: 'active', image: 'https://placehold.co/50' },
  { id: 3, name: 'Casquette Cool', category: 'Accessoires', price: 15.00, stock: 0, status: 'draft', image: 'https://placehold.co/50' },
])

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'name',
    header: 'Produit',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
      h(UAvatar, { src: row.original.image, size: 'md', class: 'rounded' }),
      h('span', { class: 'font-medium' }, row.original.name)
    ])
  },
  { accessorKey: 'category', header: 'Catégorie' },
  {
    accessorKey: 'price',
    header: 'Prix',
    cell: ({ row }) => `${row.original.price} €`
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => h('span', { class: row.original.stock < 10 ? 'text-red-500 font-bold' : '' }, row.original.stock)
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => h(UBadge, {
      color: row.original.status === 'active' ? 'success' : 'neutral',
      variant: 'subtle'
    }, () => row.original.status === 'active' ? 'Publié' : 'Brouillon')
  },
  {
    id: 'actions',
    cell: ({ row }) => h(UDropdownMenu, {
      items: [[{ label: 'Éditer', icon: 'i-lucide-edit' }, { label: 'Dupliquer', icon: 'i-lucide-copy' }], [{ label: 'Supprimer', icon: 'i-lucide-trash', color: 'error' }]]
    }, () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', variant: 'ghost', color: 'neutral' }))
  }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Produits">
        <template #right>
          <UButton label="Ajouter un produit" icon="i-lucide-plus" to="/products/add" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable :data="data" :columns="columns" />
    </template>
  </UDashboardPanel>
</template>
