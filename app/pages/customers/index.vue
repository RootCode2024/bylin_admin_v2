<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Customer } from '~/types/customer'
import type { Table as TanstackTable } from '@tanstack/table-core'

// ========================================
// Composables
// ========================================
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const router = useRouter()

const {
  customers,
  loading,
  pagination,
  filters,
  fetchCustomers,
  setPage,
  setSearch,
  setStatus
} = useCustomers()

// ========================================
// Configuration Table
// ========================================
const table = useTemplateRef<{ tableApi: TanstackTable<Customer> }>('table')

// Configuration des colonnes (Typage strict)
const columns: TableColumn<Customer>[] = [
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
      'ariaLabel': 'Sélectionner la ligne'
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
    header: 'Client',
    cell: ({ row }) => {
      const fullName = `${row.original.first_name} ${row.original.last_name}`
      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group',
        onClick: () => navigateToDetails(row.original.id)
      }, [
        h(UAvatar, {
          src: row.original.avatar_url,
          alt: fullName,
          size: 'md',
          class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105'
        }),
        h('div', [
          h('p', { class: 'font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, fullName),
          h('p', { class: 'text-xs text-gray-500' }, row.original.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status
      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color: statusColors[status] || 'neutral',
        size: 'sm'
      }, () => statusLabels[status] || status)
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

// ========================================
// État Local & Logique
// ========================================
const rowSelection = ref<Record<string, boolean>>({})
const localSearch = ref(filters.value.search)
const localStatus = ref(filters.value.status)

// Gestion Modale Suppression
const isDeleteModalOpen = ref(false)
const idsToDelete = ref<string[]>([])

// Mapping des statuts
const statusLabels: Record<string, string> = {
  all: 'Tous',
  active: 'Actif',
  inactive: 'Inactif',
  subscribed: 'Abonné',
  unsubscribed: 'Désabonné',
  bounced: 'Rejeté',
  suspended: 'Suspendu'
}

const statusColors: Record<string, string> = {
  active: 'success',
  subscribed: 'success',
  inactive: 'neutral',
  unsubscribed: 'neutral',
  suspended: 'warning',
  bounced: 'error'
}

// ========================================
// Actions
// ========================================
function navigateToDetails(id: string) {
  router.push(`/customers/${id}`)
}

// Ouvre la modale de suppression
function confirmDelete(ids: string[]) {
  idsToDelete.value = ids
  isDeleteModalOpen.value = true
}

// Callback après suppression réussie
function onDeleteSuccess() {
  rowSelection.value = {}
  // Le composable s'occupe déjà de refreshCustomers normalement
}

function getRowItems(customer: Customer) {
  return [
    [
      {
        label: 'Voir détails',
        icon: 'i-lucide-eye',
        onSelect: () => navigateToDetails(customer.id)
      },
      {
        label: 'Copier ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          navigator.clipboard.writeText(customer.id)
          toast.add({ title: 'ID copié', color: 'success', icon: 'i-lucide-check' })
        }
      }
    ],
    [{
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => confirmDelete([customer.id])
    }]
  ]
}

// ========================================
// Computed & Watchers
// ========================================
const selectedIds = computed(() => {
  const api = table.value?.tableApi
  if (!api) return []
  return api.getSelectedRowModel().rows.map(row => row.original.id)
})

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => setPage(val - 1)
})

// Colonnes affichables pour le menu "Affichage"
const visibleColumns = computed(() =>
  table.value?.tableApi?.getAllColumns().filter(c => c.getCanHide()) || []
)

watchDebounced(localSearch, (val) => setSearch(val), { debounce: 400 })
watch(localStatus, (val) => setStatus(val))

onMounted(() => {
  fetchCustomers()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Clients" badge="4.2">
        <template #right>
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UInput v-model="localSearch" icon="i-lucide-search" placeholder="Rechercher un client..."
            class="w-full sm:w-72" :ui="{ trailing: 'pointer-events-auto' }">
            <template #trailing v-if="localSearch">
              <UButton color="neutral" variant="link" icon="i-lucide-x" :padded="false" @click="localSearch = ''" />
            </template>
          </UInput>

          <USelectMenu v-model="localStatus"
            :items="Object.entries(statusLabels).map(([v, l]) => ({ label: l, value: v }))" value-key="value"
            class="w-40" />
        </div>

        <div class="flex items-center gap-2">
          <!-- Action de masse avec transition -->
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
            <UButton v-if="selectedIds.length > 0" color="error" variant="soft" icon="i-lucide-trash-2"
              :label="`Supprimer (${selectedIds.length})`" @click="confirmDelete(selectedIds)" />
          </Transition>

          <!-- Menu Colonnes -->
          <UDropdownMenu :items="visibleColumns.map(col => ({
            label: upperFirst(col.id === 'name' ? 'Client' : col.id),
            type: 'checkbox',
            checked: col.getIsVisible(),
            onUpdateChecked: (v: boolean) => col.toggleVisibility(!!v)
          }))" :content="{ align: 'end' }">
            <UButton icon="i-lucide-sliders-horizontal" color="neutral" variant="outline" label="Affichage" />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tableau avec Skeleton et Empty State -->
      <div
        class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 flex flex-col">
        <UTable ref="table" v-model:row-selection="rowSelection" :data="customers as any" :columns="columns"
          :loading="loading" class="flex-1">
          <!-- Loading State (Skeleton) -->
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
                <USkeleton class="h-8 w-8 rounded-full ml-auto" />
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
                <UIcon name="i-lucide-users" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">Aucun client trouvé</p>
              <p class="text-sm text-gray-500 mt-1" v-if="localSearch || localStatus !== 'all'">
                Essayez de modifier vos filtres de recherche.
              </p>
              <UButton v-if="localSearch || localStatus !== 'all'" label="Réinitialiser les filtres" variant="link"
                color="primary" class="mt-2" @click="{ localSearch = ''; localStatus = 'all' }" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ pagination.total }}</span> client(s)
        </span>
        <UPagination v-model:page="currentPage" :total="pagination.total" :items-per-page="pagination.pageSize"
          :sibling-count="1" />
      </div>

      <!-- Modale de suppression (Déportée) -->
      <CustomersDeleteModal v-model:open="isDeleteModalOpen" :ids="idsToDelete" @success="onDeleteSuccess" />
    </template>
  </UDashboardPanel>
</template>
