<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Brand } from '~/types/brand'
import type { Table as TanstackTable } from '@tanstack/table-core'

definePageMeta({
  layout: 'default',
  title: 'Marques',
  description: 'Gérer les marques de produits'
})

// ========================================
// Composants résolus
// ========================================
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// ========================================
// Composables
// ========================================
const toast = useToast()

const {
  brands,
  loading,
  pagination,
  filters,
  fetchBrands,
  toggleStatus,
  setPage,
  setSearch,
  setStatus,
  setTrashedFilter
} = useBrands()

// ========================================
// État local
// ========================================
const table = useTemplateRef<{ tableApi: TanstackTable<Brand> }>('table')
const rowSelection = ref<Record<string, boolean>>({})

// États locaux pour les filtres UI
const localSearch = ref<string>(filters.value.search || '')
const localStatus = ref<'all' | 'active' | 'inactive'>('all')
const showTrashed = ref<boolean>(filters.value.only_trashed || false)

// Modales
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const brandToEdit = ref<Brand | null>(null)
const idsToDelete = ref<string[]>([])

// ========================================
// Configuration
// ========================================
const statusLabels: Record<'all' | 'active' | 'inactive', string> = {
  all: 'Tous',
  active: 'Actives',
  inactive: 'Inactives'
}

// ========================================
// Colonnes de la table
// ========================================
const columns: TableColumn<Brand>[] = [
  {
    id: 'select',
    header: ({ table }) => h(UCheckbox, {
      'modelValue': table.getIsAllPageRowsSelected(),
      'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Tout sélectionner'
    }),
    cell: ({ row }) => h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value),
      'ariaLabel': 'Sélectionner'
    }),
    enableHiding: false
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs text-gray-500' }, row.original.id.substring(0, 8))
  },
  {
    accessorKey: 'name',
    header: 'Marque',
    cell: ({ row }) => {
      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group',
        onClick: () => openEditModal(row.original)
      }, [
        row.original.logo_url
          ? h(UAvatar, {
            src: row.original.logo_url,
            alt: row.original.name,
            size: 'md',
            class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105'
          })
          : h(UAvatar, {
            icon: 'i-lucide-tag',
            size: 'md',
            class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105'
          }),
        h('div', [
          h('p', { class: 'font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.name),
          row.original.website && h('p', { class: 'text-xs text-gray-500 truncate max-w-[200px]' }, row.original.website)
        ])
      ])
    }
  },
  {
    accessorKey: 'products_count',
    header: 'Produits',
    cell: ({ row }) => {
      const count = row.original.products_count || 0
      return h(UBadge, {
        variant: 'subtle',
        color: count > 0 ? 'primary' : 'neutral',
        size: 'sm'
      }, () => count.toString())
    }
  },
  {
    accessorKey: 'is_active',
    header: 'Statut',
    cell: ({ row }) => {
      const brand = row.original
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UBadge, {
          class: 'capitalize',
          variant: 'subtle',
          color: brand.is_active ? 'success' : 'neutral',
          size: 'sm'
        }, () => brand.is_active ? 'Active' : 'Inactive'),
        brand.deleted_at && h(UBadge, {
          variant: 'subtle',
          color: 'error',
          size: 'sm'
        }, () => 'Supprimée')
      ])
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Créée',
    cell: ({ row }) => h('span', { class: 'text-sm text-gray-600' },
      formatRelativeTimeFR(row.original.created_at)
    )
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => h(
      'div',
      { class: 'text-right' },
      h(UDropdownMenu, {
        content: { align: 'end' },
        items: getRowItems(row.original)
      }, () => h(UButton, {
        icon: 'i-lucide-ellipsis-vertical',
        color: 'neutral',
        variant: 'ghost',
        size: 'sm'
      }))
    )
  }
]

// ========================================
// Actions
// ========================================
function getRowItems(brand: Brand) {
  const items: any[] = [
    [
      {
        label: 'Modifier',
        icon: 'i-lucide-pencil',
        onSelect: () => openEditModal(brand)
      },
      {
        label: 'Copier ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          navigator.clipboard.writeText(brand.id)
          toast.add({ title: 'ID copié', color: 'success', icon: 'i-lucide-check' })
        }
      }
    ]
  ]

  // Actions de statut
  items.push([{
    label: brand.is_active ? 'Désactiver' : 'Activer',
    icon: brand.is_active ? 'i-lucide-x-circle' : 'i-lucide-check-circle',
    onSelect: () => handleToggleStatus(brand.id)
  }])

  // Suppression
  items.push([{
    label: 'Supprimer',
    icon: 'i-lucide-trash',
    color: 'error',
    onSelect: () => {
      idsToDelete.value = [brand.id]
      isDeleteModalOpen.value = true
    }
  }])

  return items
}

function openEditModal(brand: Brand) {
  brandToEdit.value = brand
  isEditModalOpen.value = true
}

function openDeleteModal(ids: string[]) {
  idsToDelete.value = ids
  isDeleteModalOpen.value = true
}

async function handleToggleStatus(id: string) {
  await toggleStatus(id)
}

function onSuccess() {
  rowSelection.value = {}
  fetchBrands()
}

// ========================================
// Computed
// ========================================
const selectedIds = computed(() => {
  const api = table.value?.tableApi
  if (!api) return []
  return api.getSelectedRowModel().rows.map(row => row.original.id)
})

const selectedBrandsHaveDeleted = computed(() => {
  const api = table.value?.tableApi
  if (!api) return false
  return api.getSelectedRowModel().rows.some(row => !!row.original.deleted_at)
})

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => setPage(val - 1)
})

const visibleColumns = computed(() =>
  table.value?.tableApi?.getAllColumns().filter(c => c.getCanHide()) || []
)

// ========================================
// Watchers
// ========================================
watchDebounced(
  localSearch,
  (val) => {
    if (val !== undefined) {
      setSearch(val)
    }
  },
  { debounce: 400 }
)

watch(localStatus, (val) => setStatus(val))
watch(showTrashed, (val) => setTrashedFilter(false, val))

onMounted(() => {
  // Initialiser les états locaux à partir des filtres
  if (filters.value.is_active === true) {
    localStatus.value = 'active'
  } else if (filters.value.is_active === false) {
    localStatus.value = 'inactive'
  } else {
    localStatus.value = 'all'
  }

  fetchBrands()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Marques" :badge="pagination.total">
        <template #right>
          <!-- Le modal CreateModal contient son propre bouton trigger -->
          <BrandCreateModal @created="onSuccess" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 w-full lg:w-auto">
          <UInput v-model="localSearch" icon="i-lucide-search" placeholder="Rechercher une marque..."
            class="w-full sm:w-72" :ui="{ trailing: 'pointer-events-auto' }">
            <template #trailing v-if="localSearch">
              <UButton color="neutral" variant="link" icon="i-lucide-x" :padded="false" @click="localSearch = ''" />
            </template>
          </UInput>

          <USelectMenu v-model="localStatus"
            :items="Object.entries(statusLabels).map(([v, l]) => ({ label: l, value: v }))" value-key="value"
            label-key="label" class="w-40" />
        </div>

        <div class="flex items-center gap-2">
          <!-- Actions de masse -->
          <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-1"
            leave-active-class="transition duration-150" leave-to-class="opacity-0 translate-y-1">
            <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
              <UButton v-if="!selectedBrandsHaveDeleted" color="error" variant="soft" icon="i-lucide-trash-2"
                :label="`Supprimer (${selectedIds.length})`" @click="openDeleteModal(selectedIds)" />
            </div>
          </Transition>

          <!-- Menu Colonnes -->
          <UDropdownMenu :items="visibleColumns.map(col => ({
            label: upperFirst(col.id === 'name' ? 'Marque' : col.id === 'is_active' ? 'Statut' : col.id === 'products_count' ? 'Produits' : col.id),
            type: 'checkbox',
            checked: col.getIsVisible(),
            onUpdateChecked: (v: boolean) => col.toggleVisibility(!!v)
          }))" :content="{ align: 'end' }">
            <UButton icon="i-lucide-sliders-horizontal" color="neutral" variant="outline" />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tableau -->
      <div
        class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 flex flex-col">
        <UTable ref="table" v-model:row-selection="rowSelection" :data="brands as any" :columns="columns"
          :loading="loading" class="flex-1">
          <!-- Loading State -->
          <template #loading-state>
            <div class="p-4 space-y-4">
              <div v-for="i in 5" :key="i" class="flex items-center gap-4">
                <USkeleton class="h-4 w-4 rounded" />
                <USkeleton class="h-10 w-10 rounded-full" />
                <div class="space-y-2 flex-1">
                  <USkeleton class="h-4 w-[30%]" />
                  <USkeleton class="h-3 w-[20%]" />
                </div>
                <USkeleton class="h-6 w-20 rounded-full" />
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
                <UIcon name="i-lucide-tag" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">Aucune marque trouvée</p>
              <p class="text-sm text-gray-500 mt-1" v-if="localSearch || localStatus !== 'all'">
                Essayez de modifier vos filtres.
              </p>
              <UButton v-if="localSearch || localStatus !== 'all'" label="Réinitialiser" variant="link" class="mt-2"
                @click="{ localSearch = ''; localStatus = 'all' }" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ pagination.total }}</span> marque(s)
        </span>
        <UPagination v-model:page="currentPage" :total="pagination.total" :items-per-page="pagination.pageSize" />
      </div>

      <!-- Modales -->
      <BrandEditModal v-model:open="isEditModalOpen" :brand="brandToEdit" @updated="onSuccess" />
      <BrandDeleteModal v-model:open="isDeleteModalOpen" :ids="idsToDelete" @success="onSuccess" />
    </template>
  </UDashboardPanel>
</template>
