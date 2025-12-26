<script setup lang="ts">
import type { Product } from '~/types/product'

const props = defineProps<{
  open: boolean
  collectionId: string
  collectionName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'added': []
}>()

// ========================================
// Composables
// ========================================
const { getAvailableProducts, addProducts } = useCollectionProducts()

// ========================================
// État
// ========================================
const isLoading = ref(false)
const isSaving = ref(false)
const availableProducts = ref<Product[]>([])
const selectedProducts = ref<string[]>([])
const searchQuery = ref('')

// ========================================
// Computed
// ========================================
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const filteredProducts = computed(() => {
  if (!searchQuery.value) return availableProducts.value

  const query = searchQuery.value.toLowerCase()
  return availableProducts.value.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query)
  )
})

const hasSelection = computed(() => selectedProducts.value.length > 0)

// ========================================
// Methods
// ========================================

async function loadAvailableProducts() {
  isLoading.value = true
  try {
    availableProducts.value = await getAvailableProducts()
  } finally {
    isLoading.value = false
  }
}

function toggleProduct(productId: string) {
  const index = selectedProducts.value.indexOf(productId)
  if (index > -1) {
    selectedProducts.value.splice(index, 1)
  } else {
    selectedProducts.value.push(productId)
  }
}

function isSelected(productId: string) {
  return selectedProducts.value.includes(productId)
}

function selectAll() {
  selectedProducts.value = filteredProducts.value.map((p) => p.id)
}

function deselectAll() {
  selectedProducts.value = []
}

async function handleAdd() {
  if (!hasSelection.value) return

  isSaving.value = true

  try {
    const success = await addProducts(props.collectionId, selectedProducts.value)

    if (success) {
      isOpen.value = false
      emit('added')
      resetState()
    }
  } finally {
    isSaving.value = false
  }
}

function resetState() {
  selectedProducts.value = []
  searchQuery.value = ''
}

// ========================================
// Watchers
// ========================================
watch(isOpen, (value) => {
  if (value) {
    loadAvailableProducts()
  } else {
    resetState()
  }
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="`Ajouter des produits à ${collectionName}`"
    description="Sélectionnez les produits à ajouter à cette collection"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-4xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Barre de recherche et actions -->
        <div class="flex items-center gap-3">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Rechercher un produit..."
            class="flex-1"
          />

          <UButton
            v-if="hasSelection"
            label="Tout désélectionner"
            color="neutral"
            variant="outline"
            size="sm"
            @click="deselectAll"
          />

          <UButton
            v-else
            label="Tout sélectionner"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="filteredProducts.length === 0"
            @click="selectAll"
          />
        </div>

        <!-- Info sélection -->
        <div v-if="hasSelection" class="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
            {{ selectedProducts.length }} produit(s) sélectionné(s)
          </span>
          <UButton
            label="Ajouter à la collection"
            color="primary"
            size="sm"
            :loading="isSaving"
            @click="handleAdd"
          />
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 p-3 border rounded-lg">
            <USkeleton class="h-4 w-4" />
            <USkeleton class="h-12 w-12 rounded" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-4 w-[60%]" />
              <USkeleton class="h-3 w-[40%]" />
            </div>
          </div>
        </div>

        <!-- Liste des produits -->
        <div v-else-if="filteredProducts.length > 0" class="space-y-2 max-h-125 overflow-y-auto">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            :class="{
              'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20': isSelected(product.id)
            }"
            @click="toggleProduct(product.id)"
          >
            <!-- Checkbox -->
            <UCheckbox
              :model-value="isSelected(product.id)"
              @update:model-value="toggleProduct(product.id)"
            />

            <!-- Image -->
            <div class="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
              <img
                v-if="product.thumbnail_url"
                :src="product.thumbnail_url"
                :alt="product.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-image" class="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ product.name }}</p>
              <p class="text-xs text-gray-500">{{ product.sku }}</p>
            </div>

            <!-- Prix et stock -->
            <div class="text-right">
              <p class="font-medium text-sm">{{ formatPriceXOF(product.price) }}</p>
              <p class="text-xs" :class="product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'">
                {{ product.stock_quantity }} en stock
              </p>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center">
          <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
            <UIcon name="i-lucide-package-x" class="w-8 h-8 text-gray-400" />
          </div>
          <p class="text-base font-medium text-gray-900 dark:text-white">
            Aucun produit disponible
          </p>
          <p class="text-sm text-gray-500 mt-1">
            Tous les produits sont déjà assignés à une collection
          </p>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Annuler"
          color="neutral"
          variant="ghost"
          :disabled="isSaving"
          @click="close"
        />

        <UButton
          label="Ajouter"
          color="primary"
          icon="i-lucide-plus"
          :loading="isSaving"
          :disabled="!hasSelection"
          @click="handleAdd"
        />
      </div>
    </template>
  </UModal>
</template>
