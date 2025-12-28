<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Category } from '~/types/category'
import type { Table as TanstackTable } from '@tanstack/table-core'
import { getLevelLabel, getLevelColor } from '~/utils/category'

definePageMeta({
  layout: 'default',
  title: 'Catégories',
  description: 'Gérer les catégories de produits'
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
  categories,
  loading,
  pagination,
  filters,
  hasActiveFilters,
  fetchCategories,
  setPage,
  setSearch,
  setStatus,
  setLevel,
  setTrashedFilter,
  setParentFilter: setParentFilterComposable,
  resetFilters
} = useCategories()

// ========================================
// État local
// ========================================
const table = useTemplateRef<{ tableApi: TanstackTable<Category> }>('table')
const rowSelection = ref<Record<string, boolean>>({})

// États locaux pour les filtres UI
const localSearch = ref<string>(filters.value.search || '')
const localStatus = ref<'all' | 'active' | 'inactive'>('all')
const localLevel = ref<'all' | '0' | '1' | '2' | '3'>('all')
const showTrashed = ref<boolean>(filters.value.only_trashed || false)

// Modales
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const categoryToEdit = ref<Category | null>(null)
const idsToDelete = ref<string[]>([])

// ========================================
// Configuration
// ========================================
const statusLabels: Record<'all' | 'active' | 'inactive', string> = {
  all: 'Tous',
  active: 'Actives',
  inactive: 'Inactives'
}

const levelLabels: Record<'all' | '0' | '1' | '2' | '3', string> = {
  all: 'Tous les niveaux',
  '0': 'Genre (0)',
  '1': 'Type (1)',
  '2': 'Catégorie (2)',
  '3': 'Sous-catégorie (3)'
}

// ========================================
// Colonnes de la table
// ========================================
const columns: TableColumn<Category>[] = [
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
    header: 'Catégorie',
    cell: ({ row }) => {
      const category = row.original
      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group',
        onClick: () => openEditModal(category)
      }, [
        category.image_url
          ? h(UAvatar, {
            src: category.image_url,
            alt: category.name,
            size: 'md',
            class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105'
          })
          : h(UAvatar, {
            icon: `i-lucide-${category.icon || 'folder'}`,
            size: 'md',
            class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105'
          }),
        h('div', { class: 'flex-1' }, [
          h('div', { class: 'flex items-center gap-2' }, [
            h('p', { class: 'font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, category.name),
            category.is_featured && h(UBadge, {
              variant: 'subtle',
              color: 'info',
              size: 'xs'
            }, () => '★ Vedête')
          ]),
          category.path && h('p', { class: 'text-xs text-gray-500 truncate max-w-[300px]' }, category.path)
        ])
      ])
    }
  },
  {
    accessorKey: 'level',
    header: 'Niveau',
    cell: ({ row }) => {
      const level = row.original.level
      return h(UBadge, {
        variant: 'subtle',
        color: getLevelColor(level),
        size: 'sm'
      }, () => getLevelLabel(level))
    }
  },
  {
    accessorKey: 'parent',
    header: 'Parent',
    cell: ({ row }) => {
      const parent = row.original.parent
      return parent
        ? h('span', { class: 'text-sm text-gray-600' }, parent.name)
        : h('span', { class: 'text-sm text-gray-400' }, '—')
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
    accessorKey: 'children_count',
    header: 'Enfants',
    cell: ({ row }) => {
      const count = row.original.children_count || 0
      return h(UBadge, {
        variant: 'subtle',
        color: count > 0 ? 'secondary' : 'neutral',
        size: 'sm'
      }, () => count.toString())
    }
  },
  {
    accessorKey: 'is_active',
    header: 'Statut',
    cell: ({ row }) => {
      const category = row.original
      return h('div', { class: 'flex items-center gap-2 flex-wrap' }, [
        h(UBadge, {
          class: 'capitalize',
          variant: 'subtle',
          color: category.is_active ? 'success' : 'neutral',
          size: 'sm'
        }, () => category.is_active ? 'Active' : 'Inactive'),
        category.is_visible_in_menu && h(UBadge, {
          variant: 'subtle',
          color: 'secondary',
          size: 'xs'
        }, () => 'Menu'),
        category.deleted_at && h(UBadge, {
          variant: 'subtle',
          color: 'error',
          size: 'sm'
        }, () => 'Supprimée')
      ])
    }
  },
  {
    accessorKey: 'sort_order',
    header: 'Ordre',
    cell: ({ row }) => h('span', { class: 'text-sm font-mono text-gray-600' }, row.original.sort_order.toString())
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
function getRowItems(category: Category) {
  const items: any[] = [
    [
      {
        label: 'Modifier',
        icon: 'i-lucide-pencil',
        onSelect: () => openEditModal(category)
      },
      {
        label: 'Voir les produits',
        icon: 'i-lucide-package',
        onSelect: () => navigateTo(`/admin/products?category=${category.id}`),
        disabled: category.products_count === 0
      },
      {
        label: 'Copier ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          navigator.clipboard.writeText(category.id)
          toast.add({ title: 'ID copié', color: 'success', icon: 'i-lucide-check' })
        }
      }
    ]
  ]

  // Voir les enfants si applicable
  if (category.children_count && category.children_count > 0) {
    items.push([{
      label: `Voir les sous-catégories (${category.children_count})`,
      icon: 'i-lucide-folder-tree',
      onSelect: () => handleParentFilter(category.id)
    }])
  }

  // Suppression
  items.push([{
    label: 'Supprimer',
    icon: 'i-lucide-trash',
    color: 'error',
    onSelect: () => {
      idsToDelete.value = [category.id]
      isDeleteModalOpen.value = true
    }
  }])

  return items
}

function openEditModal(category: Category) {
  categoryToEdit.value = category
  isEditModalOpen.value = true
}

function openDeleteModal(ids: string[]) {
  idsToDelete.value = ids
  isDeleteModalOpen.value = true
}

/**
 * Gère le filtre parent avec feedback utilisateur
 */
function handleParentFilter(parentId: string) {
  setParentFilterComposable(parentId)

  toast.add({
    title: 'Filtre appliqué',
    description: 'Affichage des sous-catégories',
    color: 'info',
    icon: 'i-lucide-filter'
  })
}

/**
 * Réinitialise tous les filtres
 */
function handleReset() {
  localSearch.value = ''
  localStatus.value = 'all'
  localLevel.value = 'all'
  showTrashed.value = false
  resetFilters()
}

function onSuccess() {
  rowSelection.value = {}
  fetchCategories()
}

// ========================================
// Computed
// ========================================
const selectedIds = computed(() => {
  const api = table.value?.tableApi
  if (!api) return []
  return api.getSelectedRowModel().rows.map(row => row.original.id)
})

const selectedCategoriesHaveDeleted = computed(() => {
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
watch(localLevel, (val) => setLevel(val))
watch(showTrashed, (val) => setTrashedFilter(false, val))

onMounted(() => {
  // Synchroniser les filtres locaux avec les filtres du composable
  if (filters.value.is_active === true) localStatus.value = 'active'
  else if (filters.value.is_active === false) localStatus.value = 'inactive'

  if (filters.value.level !== undefined) {
    localLevel.value = filters.value.level.toString() as any
  }

  // Charger les catégories si aucun filtre n'est actif
  if (localStatus.value === 'all' && localLevel.value === 'all' && !localSearch.value) {
    fetchCategories()
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Catégories" :badge="pagination.total">
        <template #right>
          <CategoryCreateModal @created="onSuccess" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <UInput
            v-model="localSearch"
            icon="i-lucide-search"
            placeholder="Rechercher une catégorie..."
            class="w-full sm:w-72"
            :ui="{ trailing: 'pointer-events-auto' }"
          >
            <template v-if="localSearch" #trailing>
              <UButton
                color="neutral"
                variant="link"
                icon="i-lucide-x"
                :padded="false"
                @click="localSearch = ''"
              />
            </template>
          </UInput>

          <USelectMenu
            v-model="localStatus"
            :items="Object.entries(statusLabels).map(([v, l]) => ({ label: l, value: v }))"
            value-key="value"
            label-key="label"
            class="w-40"
          />

          <USelectMenu
            v-model="localLevel"
            :items="Object.entries(levelLabels).map(([v, l]) => ({ label: l, value: v }))"
            value-key="value"
            label-key="label"
            class="w-52"
          />

          <UButton
            v-if="hasActiveFilters"
            icon="i-lucide-filter-x"
            color="gray"
            variant="ghost"
            label="Effacer filtres"
            @click="handleReset"
          />
        </div>

        <div class="flex items-center gap-2">
          <!-- Actions de masse -->
          <Transition
            enter-active-class="transition duration-200"
            enter-from-class="opacity-0 translate-y-1"
            leave-active-class="transition duration-150"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
              <UButton
                v-if="!selectedCategoriesHaveDeleted"
                color="error"
                variant="soft"
                icon="i-lucide-trash-2"
                :label="`Supprimer (${selectedIds.length})`"
                @click="openDeleteModal(selectedIds)"
              />
            </div>
          </Transition>

          <!-- Menu Colonnes -->
          <UDropdownMenu
            :items="visibleColumns.map(col => ({
              label: upperFirst(col.id === 'name' ? 'Catégorie' : col.id === 'is_active' ? 'Statut' : col.id === 'products_count' ? 'Produits' : col.id),
              type: 'checkbox',
              checked: col.getIsVisible(),
              onUpdateChecked: (v: boolean) => col.toggleVisibility(!!v)
            }))"
            :content="{ align: 'end' }"
          >
            <UButton icon="i-lucide-sliders-horizontal" color="neutral" variant="outline" />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tableau -->
      <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 flex flex-col">
        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="categories as any"
          :columns="columns"
          :loading="loading"
          class="flex-1"
        >
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
                <UIcon name="i-lucide-folder" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">Aucune catégorie trouvée</p>
              <p v-if="localSearch || localStatus !== 'all' || localLevel !== 'all'" class="text-sm text-gray-500 mt-1">
                Essayez de modifier vos filtres.
              </p>
              <UButton
                v-if="localSearch || localStatus !== 'all' || localLevel !== 'all'"
                label="Réinitialiser"
                variant="link"
                class="mt-2"
                @click="handleReset"
              />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ pagination.total }}</span> catégorie(s)
        </span>
        <UPagination
          v-model:page="currentPage"
          :total="pagination.total"
          :items-per-page="pagination.pageSize"
        />
      </div>

      <!-- Modales -->
      <CategoryEditModal
        v-model:open="isEditModalOpen"
        :category="categoryToEdit"
        @updated="onSuccess"
      />
      <CategoryDeleteModal
        v-model:open="isDeleteModalOpen"
        :ids="idsToDelete"
        @success="onSuccess"
      />
    </template>
  </UDashboardPanel>
</template>
