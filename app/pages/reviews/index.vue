<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Review, ReviewStatus } from '~/types/review'
import type { Table as TanstackTable } from '@tanstack/table-core'
import {
  getReviewStatusLabel,
  getReviewStatusColor,
  getStarsArray,
  getCommentExcerpt,
  hasMedia,
  countImages,
  countVideos
} from '~/utils/review'
import { formatRelativeTimeFR } from '~/utils/formatRelativeTimeFR'

definePageMeta({
  layout: 'default',
  title: 'Avis clients',
  description: 'Gérer et modérer les avis clients'
})

// ========================================
// Composants résolus
// ========================================
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

// ========================================
// Composables
// ========================================
const toast = useToast()
const router = useRouter()

const {
  reviews: reviewsData,
  loading,
  loadingState,
  pagination,
  filters,
  statistics,
  fetchReviews,
  approveReview,
  rejectReview,
  deleteReviews,
  bulkApprove,
  bulkReject,
  setSearch,
  setStatus,
  setRating,
  setVerifiedFilter,
  resetFilters,
  setPage,
  fetchStatistics
} = useReviews()

// ========================================
// État local UI
// ========================================
const table = useTemplateRef<{ tableApi: TanstackTable<Review> }>('table')
const rowSelection = ref<Record<string, boolean>>({})

// Filtres UI locaux
const localSearch = ref<string>(filters.value.search || '')
const localStatus = ref<ReviewStatus | 'all'>(filters.value.status || 'all')
const localRating = ref<number | 'all'>('all')
const localVerifiedOnly = ref<boolean>(false)

// Modales
const deleteModal = ref({
  open: false,
  ids: [] as string[]
})

const rejectModal = ref({
  open: false,
  reviewId: '',
  reason: ''
})

const detailModal = ref({
  open: false,
  review: null as Review | null
})

// ========================================
// Configuration
// ========================================
const statusLabels: Record<ReviewStatus | 'all', string> = {
  all: 'Tous les statuts',
  pending: 'En attente',
  approved: 'Approuvés',
  rejected: 'Rejetés'
}

const ratingLabels: Record<number | 'all', string> = {
  all: 'Toutes les notes',
  5: '5 étoiles',
  4: '4 étoiles',
  3: '3 étoiles',
  2: '2 étoiles',
  1: '1 étoile'
}

// ========================================
// Computed
// ========================================
const tableData = computed(() => reviewsData.value)

const selectedIds = computed(() => {
  const api = table.value?.tableApi
  if (!api) return []
  return api.getSelectedRowModel().rows.map(row => row.original.id)
})

const currentPage = computed({
  get: () => pagination.value?.current_page || 1,
  set: (val) => setPage(val)
})

const paginationTotal = computed(() => pagination.value?.total || 0)
const paginationPerPage = computed(() => pagination.value?.per_page || 15)

const hasActiveFilters = computed(() => {
  return localSearch.value !== '' ||
    localStatus.value !== 'all' ||
    localRating.value !== 'all' ||
    localVerifiedOnly.value
})

// ========================================
// Colonnes de la table
// ========================================
const columns: TableColumn<Review>[] = [
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
    accessorKey: 'customer',
    header: 'Client',
    cell: ({ row }) => {
      const review = row.original
      const customer = review.customer

      return h('div', {
        class: 'flex items-center gap-3 min-w-[200px]'
      }, [
        customer?.avatar_url
          ? h(UAvatar, {
            src: customer.avatar_url,
            alt: `${customer.first_name} ${customer.last_name}`,
            size: 'md'
          })
          : h(UAvatar, {
            icon: 'i-lucide-user',
            size: 'md',
            class: 'bg-gray-100 dark:bg-gray-800'
          }),
        h('div', { class: 'flex-1 overflow-hidden' }, [
          h('p', {
            class: 'font-medium text-gray-900 dark:text-white truncate text-sm'
          }, customer ? `${customer.first_name} ${customer.last_name}` : 'Client inconnu'),
          h('p', {
            class: 'text-xs text-gray-500 truncate'
          }, customer?.email || '—')
        ])
      ])
    }
  },
  {
    accessorKey: 'product',
    header: 'Produit',
    cell: ({ row }) => {
      const review = row.original
      const product = review.product

      if (!product) return h('span', { class: 'text-gray-400 text-sm' }, 'Produit supprimé')

      return h('div', {
        class: 'flex items-center gap-2 cursor-pointer hover:text-primary-500 transition-colors min-w-[180px]',
        onClick: () => router.push(`/products/${product.id}`)
      }, [
        product.thumbnail_url
          ? h(UAvatar, {
            src: product.thumbnail_url,
            alt: product.name,
            size: 'sm',
            class: 'rounded-md'
          })
          : h(UAvatar, {
            icon: 'i-lucide-package',
            size: 'sm',
            class: 'bg-gray-100 dark:bg-gray-800 rounded-md'
          }),
        h('div', { class: 'flex-1 overflow-hidden' }, [
          h('p', {
            class: 'font-medium text-sm truncate'
          }, product.name),
          h('p', {
            class: 'text-xs text-gray-500'
          }, product.sku)
        ])
      ])
    }
  },
  {
    accessorKey: 'rating',
    header: 'Note',
    cell: ({ row }) => {
      const rating = row.original.rating
      const stars = getStarsArray(rating)

      return h('div', { class: 'flex items-center gap-1' }, [
        ...Array(stars.filled).fill(null).map(() =>
          h(UIcon, { name: 'i-lucide-star', class: 'w-4 h-4 text-yellow-500 fill-current' })
        ),
        stars.half ? h(UIcon, { name: 'i-lucide-star-half', class: 'w-4 h-4 text-yellow-500 fill-current' }) : null,
        ...Array(stars.empty).fill(null).map(() =>
          h(UIcon, { name: 'i-lucide-star', class: 'w-4 h-4 text-gray-300' })
        )
      ])
    }
  },
  {
    accessorKey: 'comment',
    header: 'Commentaire',
    cell: ({ row }) => {
      const review = row.original

      return h('div', { class: 'max-w-md' }, [
        review.title
          ? h('p', { class: 'font-medium text-sm text-gray-900 dark:text-white mb-1' }, review.title)
          : null,
        h('p', {
          class: 'text-xs text-gray-600 dark:text-gray-400 line-clamp-2'
        }, getCommentExcerpt(review.comment, 100))
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status
      return h(UBadge, {
        variant: 'subtle',
        color: getReviewStatusColor(status),
        size: 'sm'
      }, () => getReviewStatusLabel(status))
    }
  },
  {
    accessorKey: 'flags',
    header: 'Info',
    cell: ({ row }) => {
      const review = row.original
      const badges = []

      if (review.is_verified_purchase) {
        badges.push(
          h(UTooltip, { text: 'Achat vérifié' }, () =>
            h(UIcon, { name: 'i-lucide-shield-check', class: 'text-green-500 w-4 h-4' })
          )
        )
      }

      if (hasMedia(review)) {
        const imageCount = countImages(review)
        const videoCount = countVideos(review)
        const mediaText = [
          imageCount > 0 ? `${imageCount} photo${imageCount > 1 ? 's' : ''}` : '',
          videoCount > 0 ? `${videoCount} vidéo${videoCount > 1 ? 's' : ''}` : ''
        ].filter(Boolean).join(', ')

        badges.push(
          h(UTooltip, { text: mediaText }, () =>
            h(UIcon, { name: 'i-lucide-image', class: 'text-blue-500 w-4 h-4' })
          )
        )
      }

      if (review.helpful_count > 0) {
        badges.push(
          h(UTooltip, { text: `${review.helpful_count} personnes trouvent cet avis utile` }, () =>
            h('span', { class: 'flex items-center gap-1 text-xs text-gray-500' }, [
              h(UIcon, { name: 'i-lucide-thumbs-up', class: 'w-3 h-3' }),
              String(review.helpful_count)
            ])
          )
        )
      }

      return h('div', { class: 'flex items-center gap-2' }, badges)
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => h('span', {
      class: 'text-xs text-gray-500'
    }, formatRelativeTimeFR(row.original.created_at))
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
function getRowItems(review: Review) {
  const items: any[] = [
    [
      {
        label: 'Voir les détails',
        icon: 'i-lucide-eye',
        onSelect: () => openDetailModal(review)
      }
    ]
  ]

  if (review.status === 'pending') {
    items.push([
      {
        label: 'Approuver',
        icon: 'i-lucide-check-circle',
        color: 'success',
        onSelect: async () => {
          const success = await approveReview(review.id)
          if (success) {
            toast.add({
              title: 'Avis approuvé',
              color: 'success',
              icon: 'i-lucide-check-circle'
            })
          }
        }
      },
      {
        label: 'Rejeter',
        icon: 'i-lucide-x-circle',
        color: 'warning',
        onSelect: () => openRejectModal(review.id)
      }
    ])
  }

  items.push([
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => openDeleteModal([review.id])
    }
  ])

  return items
}

function openDeleteModal(ids: string[]) {
  deleteModal.value = {
    open: true,
    ids
  }
}

function openRejectModal(reviewId: string) {
  rejectModal.value = {
    open: true,
    reviewId,
    reason: ''
  }
}

function openDetailModal(review: Review) {
  detailModal.value = {
    open: true,
    review
  }
}

async function handleReject() {
  const success = await rejectReview(
    rejectModal.value.reviewId,
    rejectModal.value.reason || undefined
  )

  if (success) {
    rejectModal.value.open = false
    rejectModal.value.reason = ''
  }
}

function handleDeleteSuccess() {
  rowSelection.value = {}
  fetchReviews()
}

function handleReset() {
  localSearch.value = ''
  localStatus.value = 'all'
  localRating.value = 'all'
  localVerifiedOnly.value = false
  resetFilters()
}

// ========================================
// Watchers
// ========================================
watchDebounced(
  localSearch,
  (val) => setSearch(val),
  { debounce: 400 }
)

watch(localStatus, (val) => {
  setStatus(val)
})

watch(localRating, (val) => {
  setRating(val === 'all' ? undefined : val)
})

watch(localVerifiedOnly, (val) => {
  setVerifiedFilter(val)
})

// ========================================
// Lifecycle
// ========================================
onMounted(async () => {
  await fetchReviews()
  await fetchStatistics()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Avis clients" :badge="paginationTotal">
        <template #right>
          <div class="flex items-center gap-2">
            <!-- Statistiques rapides -->
            <div v-if="statistics" class="flex items-center gap-3 mr-4">
              <UTooltip text="En attente">
                <UBadge variant="subtle" color="warning" size="sm">
                  {{ statistics.pending }}
                </UBadge>
              </UTooltip>
              <UTooltip text="Approuvés">
                <UBadge variant="subtle" color="success" size="sm">
                  {{ statistics.approved }}
                </UBadge>
              </UTooltip>
              <UTooltip text="Note moyenne">
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-star" class="w-4 h-4 text-yellow-500 fill-current" />
                  <span class="text-sm font-medium">{{ statistics.average_rating }}</span>
                </div>
              </UTooltip>
            </div>
          </div>
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
            placeholder="Rechercher (Client, Produit, Commentaire)..."
            class="w-full sm:w-80"
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
            :items="Object.entries(statusLabels).map(([v, l]) => ({
              label: l,
              value: v
            }))"
            value-key="value"
            label-key="label"
            class="w-40"
          />

          <USelectMenu
            v-model="localRating"
            :items="Object.entries(ratingLabels).map(([v, l]) => ({
              label: l,
              value: v === 'all' ? 'all' : Number(v)
            }))"
            value-key="value"
            label-key="label"
            class="w-40"
          />

          <UButton
            :color="localVerifiedOnly ? 'primary' : 'neutral'"
            :variant="localVerifiedOnly ? 'soft' : 'outline'"
            icon="i-lucide-shield-check"
            @click="localVerifiedOnly = !localVerifiedOnly"
          >
            Vérifiés
          </UButton>

          <UButton
            v-if="hasActiveFilters"
            icon="i-lucide-filter-x"
            color="gray"
            variant="ghost"
            label="Reset"
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
                color="success"
                variant="soft"
                icon="i-lucide-check-circle"
                :label="`Approuver (${selectedIds.length})`"
                @click="bulkApprove(selectedIds)"
              />
              <UButton
                color="warning"
                variant="soft"
                icon="i-lucide-x-circle"
                :label="`Rejeter (${selectedIds.length})`"
                @click="bulkReject(selectedIds)"
              />
              <UButton
                color="error"
                variant="soft"
                icon="i-lucide-trash-2"
                :label="`Supprimer (${selectedIds.length})`"
                @click="openDeleteModal(selectedIds)"
              />
            </div>
          </Transition>
        </div>
      </div>

      <!-- Tableau -->
      <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 flex flex-col">
        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="tableData"
          :columns="columns"
          :loading="loadingState === 'loading'"
          class="flex-1"
        >
          <!-- Loading State -->
          <template #loading-state>
            <div class="p-4 space-y-4">
              <div v-for="i in 5" :key="i" class="flex items-center gap-4">
                <USkeleton class="h-4 w-4 rounded" />
                <USkeleton class="h-10 w-10 rounded-full" />
                <div class="space-y-2 flex-1">
                  <USkeleton class="h-4 w-[60%]" />
                  <USkeleton class="h-3 w-[40%]" />
                </div>
                <USkeleton class="h-6 w-20 rounded-full" />
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
                <UIcon name="i-lucide-message-square-off" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">
                Aucun avis trouvé
              </p>
              <p v-if="hasActiveFilters" class="text-sm text-gray-500 mt-1">
                Essayez de modifier vos critères de recherche.
              </p>
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div
        v-if="paginationTotal > 0"
        class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4"
      >
        <span class="text-sm text-gray-500">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ paginationTotal }}</span> avis
        </span>
        <UPagination v-model:page="currentPage" :total="paginationTotal" :items-per-page="paginationPerPage" />
      </div>
    </template>
  </UDashboardPanel>

  <!-- Modales -->
  <ClientOnly>
    <!-- Modale de suppression -->
    <ReviewDeleteModal
      v-model:open="deleteModal.open"
      :ids="deleteModal.ids"
      @success="handleDeleteSuccess"
    />

    <!-- Modale de rejet -->
    <UModal v-model:open="rejectModal.open" title="Rejeter l'avis">
      <template #body>
        <div class="p-4 space-y-4">
          <UFormField label="Raison du rejet (optionnel)">
            <UTextarea
              v-model="rejectModal.reason"
              :rows="3"
              placeholder="Expliquez pourquoi cet avis est rejeté..."
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              label="Annuler"
              color="neutral"
              variant="ghost"
              @click="rejectModal.open = false"
            />
            <UButton
              label="Rejeter"
              color="error"
              icon="i-lucide-x-circle"
              @click="handleReject"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modale de détails -->
    <ReviewDetailModal
      v-model:open="detailModal.open"
      :review="detailModal.review"
      @approve="approveReview"
      @reject="openRejectModal"
    />
  </ClientOnly>
</template>
