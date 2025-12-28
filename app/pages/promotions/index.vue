<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Promotion } from '~/types/promotion'
import type { Table as TanstackTable } from '@tanstack/table-core'
import {
  getTypeLabel,
  getTypeIcon,
  getTypeColor,
  getPromotionStatus,
  getStatusLabel,
  getStatusColor,
  formatPromotionValue,
  formatUsageLimit,
  getPromotionDaysRemaining
} from '~/utils/promotion'

definePageMeta({
  layout: 'default',
  title: 'Promotions',
  description: 'Gérer les promotions et codes promo'
})

// Composants résolus
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()

const {
  promotions,
  loading,
  pagination,
  filters,
  hasActiveFilters,
  fetchPromotions,
  setPage,
  setSearch,
  setType,
  setStatus,
  setTrashedFilter,
  toggleActive,
  resetFilters
} = usePromotions()

// États locaux
const table = useTemplateRef<{ tableApi: TanstackTable<Promotion> }>('table')
const rowSelection = ref<Record<string, boolean>>({})

const localSearch = ref<string>(filters.value.search || '')
const localType = ref<string>('all')
const localStatus = ref<string>('all')
const showTrashed = ref<boolean>(filters.value.only_trashed || false)

// Modales
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const promotionToEdit = ref<Promotion | null>(null)
const idsToDelete = ref<string[]>([])

// Labels
const typeLabels: Record<string, string> = {
  all: 'Tous les types',
  percentage: 'Pourcentage',
  fixed: 'Montant fixe',
  buy_x_get_y: 'Achetez X obtenez Y'
}

const statusLabels: Record<string, string> = {
  all: 'Tous les statuts',
  active: 'Actives',
  inactive: 'Inactives',
  expired: 'Expirées',
  upcoming: 'À venir'
}

// Colonnes
const columns: TableColumn<Promotion>[] = [
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
    accessorKey: 'name',
    header: 'Promotion',
    cell: ({ row }) => {
      const promo = row.original
      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group',
        onClick: () => openEditModal(promo)
      }, [
        h(UAvatar, {
          icon: getTypeIcon(promo.type),
          size: 'md',
          class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105'
        }),
        h('div', { class: 'flex-1' }, [
          h('div', { class: 'flex items-center gap-2' }, [
            h('p', {
              class: 'font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors'
            }, promo.name),
          ]),
          promo.code && h('p', { class: 'text-xs text-gray-500 font-mono' }, promo.code)
        ])
      ])
    }
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type
      return h(UBadge, {
        variant: 'subtle',
        color: getTypeColor(type),
        size: 'sm'
      }, () => getTypeLabel(type))
    }
  },
  {
    accessorKey: 'value',
    header: 'Valeur',
    cell: ({ row }) => {
      const promo = row.original
      return h('span', { class: 'text-sm font-medium' }, formatPromotionValue(promo))
    }
  },
  {
    accessorKey: 'usage',
    header: 'Utilisation',
    cell: ({ row }) => {
      const promo = row.original
      return h('div', { class: 'space-y-1' }, [
        h('p', { class: 'text-sm font-medium' }, `${promo.usage_count} utilisations`),
        h('p', { class: 'text-xs text-gray-500' }, formatUsageLimit(promo))
      ])
    }
  },
  {
    accessorKey: 'validity',
    header: 'Validité',
    cell: ({ row }) => {
      const promo = row.original
      const daysRemaining = getDaysRemaining(promo.expires_at)

      if (!promo.expires_at) {
        return h('span', { class: 'text-sm text-gray-500' }, 'Permanente')
      }

      if (daysRemaining === 0) {
        return h(UBadge, { variant: 'subtle', color: 'error', size: 'sm' }, () => 'Expirée')
      }

      if (daysRemaining && daysRemaining <= 7) {
        return h(UBadge, { variant: 'subtle', color: 'warning', size: 'sm' }, () => `${daysRemaining}j restants`)
      }

      return h('span', { class: 'text-sm text-gray-600' }, `${daysRemaining}j restants`)
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const promo = row.original
      const status = getPromotionStatus(promo)

      return h('div', { class: 'flex items-center gap-2' }, [
        h(UBadge, {
          variant: 'subtle',
          color: getStatusColor(status),
          size: 'sm'
        }, () => getStatusLabel(status)),
        promo.deleted_at && h(UBadge, {
          variant: 'subtle',
          color: 'error',
          size: 'xs'
        }, () => 'Supprimée')
      ])
    }
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

// Actions
function getRowItems(promotion: Promotion) {
  const items: any[] = [
    [{
      label: 'Modifier',
      icon: 'i-lucide-pencil',
      onSelect: () => openEditModal(promotion)
    }]
  ]

  // Toggle active/inactive
  if (promotion.is_active) {
    items.push([{
      label: 'Désactiver',
      icon: 'i-lucide-pause',
      onSelect: () => handleToggleActive(promotion.id, false)
    }])
  } else {
    items.push([{
      label: 'Activer',
      icon: 'i-lucide-play',
      color: 'success',
      onSelect: () => handleToggleActive(promotion.id, true)
    }])
  }

  // Copier code
  if (promotion.code) {
    items.push([{
      label: 'Copier le code',
      icon: 'i-lucide-copy',
      onSelect: () => {
        navigator.clipboard.writeText(promotion.code!)
        toast.add({
          title: 'Code copié',
          color: 'success',
          icon: 'i-lucide-check'
        })
      }
    }])
  }

  // Suppression
  items.push([{
    label: 'Supprimer',
    icon: 'i-lucide-trash',
    color: 'error',
    onSelect: () => {
      idsToDelete.value = [promotion.id]
      isDeleteModalOpen.value = true
    }
  }])

  return items
}

function openEditModal(promotion: Promotion) {
  promotionToEdit.value = promotion
  isEditModalOpen.value = true
}

function openDeleteModal(ids: string[]) {
  idsToDelete.value = ids
  isDeleteModalOpen.value = true
}

async function handleToggleActive(id: string, isActive: boolean) {
  await toggleActive(id, isActive)
}

function handleReset() {
  localSearch.value = ''
  localType.value = 'all'
  localStatus.value = 'all'
  showTrashed.value = false
  resetFilters()
}

function onSuccess() {
  rowSelection.value = {}
  fetchPromotions()
}

// Computed
const selectedIds = computed(() => {
  const api = table.value?.tableApi
  if (!api) return []
  return api.getSelectedRowModel().rows.map(row => row.original.id)
})

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => setPage(val - 1)
})

const visibleColumns = computed(() =>
  table.value?.tableApi?.getAllColumns().filter(c => c.getCanHide()) || []
)

// Watchers
watchDebounced(
  localSearch,
  (val) => {
    if (val !== undefined) {
      setSearch(val)
    }
  },
  { debounce: 400 }
)

watch(localType, (val) => setType(val))
watch(localStatus, (val) => setStatus(val))
watch(showTrashed, (val) => setTrashedFilter(false, val))

onMounted(() => {
  if (localType.value === 'all' && localStatus.value === 'all' && !localSearch.value) {
    fetchPromotions()
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Promotions" :badge="pagination.total">
        <template #right>
          <PromotionCreateModal @created="onSuccess" />
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
            placeholder="Rechercher une promotion..."
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
            v-model="localType"
            :items="Object.entries(typeLabels).map(([v, l]) => ({ label: l, value: v }))"
            value-key="value"
            label-key="label"
            class="w-52"
          />

          <USelectMenu
            v-model="localStatus"
            :items="Object.entries(statusLabels).map(([v, l]) => ({ label: l, value: v }))"
            value-key="value"
            label-key="label"
            class="w-48"
          />

          <UButton
            v-if="hasActiveFilters"
            icon="i-lucide-filter-x"
            color="neutral"
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
              label: upperFirst(col.id),
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
          :data="promotions as any"
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
                <UIcon name="i-lucide-ticket" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">Aucune promotion trouvée</p>
              <p v-if="localSearch || localType !== 'all' || localStatus !== 'all'" class="text-sm text-gray-500 mt-1">
                Essayez de modifier vos filtres.
              </p>
              <UButton
                v-if="localSearch || localType !== 'all' || localStatus !== 'all'"
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
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ pagination.total }}</span> promotion(s)
        </span>
        <UPagination
          v-model:page="currentPage"
          :total="pagination.total"
          :items-per-page="pagination.pageSize"
        />
      </div>

      <!-- Modales -->
      <PromotionEditModal
        v-model:open="isEditModalOpen"
        :promotion="promotionToEdit"
        @updated="onSuccess"
      />
      <PromotionDeleteModal
        v-model:open="isDeleteModalOpen"
        :ids="idsToDelete"
        @success="onSuccess"
      />
    </template>
  </UDashboardPanel>
</template>
