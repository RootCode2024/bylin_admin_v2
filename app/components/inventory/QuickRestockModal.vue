<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { InventoryItem } from '~/types/inventory'

interface Props {
  item: InventoryItem | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  success: []
}>()

const { adjustStock, loading } = useInventories()

const open = defineModel<boolean>('open', { required: true })

// Quantités rapides
const quickQuantities = [10, 25, 50, 100]

// Schéma de validation
const schema = z.object({
  quantity: z.number()
    .int('La quantité doit être un nombre entier')
    .min(1, 'La quantité doit être au moins 1'),
  notes: z.string()
    .max(300, 'Les notes ne peuvent pas dépasser 300 caractères')
    .trim()
    .optional()
    .or(z.literal(''))
})

type QuickRestockFormSchema = z.infer<typeof schema>

// État du formulaire
const state = reactive<QuickRestockFormSchema>({
  quantity: 10,
  notes: ''
})

const defaultState: QuickRestockFormSchema = {
  quantity: 10,
  notes: ''
}

// Computed
const newStockPreview = computed(() => {
  if (!props.item) return 0
  return props.item.stock_quantity + state.quantity
})

const notesLength = computed(() => state.notes?.length || 0)
const notesRemaining = computed(() => 300 - notesLength.value)

// Methods
function selectQuickQuantity(qty: number) {
  state.quantity = qty
}

function resetForm() {
  Object.assign(state, defaultState)
}

async function onSubmit(event: FormSubmitEvent<QuickRestockFormSchema>) {
  if (!props.item) return

  try {
    const success = await adjustStock({
      product_id: props.item.product_id,
      variation_id: props.item.variation_id ?? null,
      quantity: event.data.quantity,
      operation: 'add',
      reason: 'purchase',
      notes: event.data.notes || null
    })

    if (success) {
      open.value = false
      emit('success')
      resetForm()
    }
  } catch (error) {
    console.error('Erreur lors du réapprovisionnement:', error)
  }
}

function handleModalClose() {
  resetForm()
}

// Watcher pour reset quand l'item change
watch(() => props.item, () => {
  if (props.item) {
    resetForm()
  }
})
</script>

<template>
  <UModal v-model:open="open" title="Réapprovisionnement rapide" description="Ajouter du stock rapidement"
    @close="handleModalClose">
    <template #body>
      <UForm v-if="item" :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <!-- Product Info -->
        <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div v-if="item.image_url" class="h-12 w-12 rounded-lg overflow-hidden">
              <img :src="item.image_url" :alt="item.name" class="h-full w-full object-cover" />
            </div>
            <div v-else class="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <UIcon name="i-heroicons-photo" class="h-6 w-6 text-gray-400" />
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ item.name }}
              </p>
              <p class="text-sm text-gray-500 truncate">
                SKU: {{ item.sku }}
              </p>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Stock actuel:</span>
              <UBadge :color="item.stock_quantity === 0 ? 'error' : 'warning'" size="sm">
                {{ item.stock_quantity }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Quick Quantity Buttons -->
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Quantité rapide
          </label>
          <div class="grid grid-cols-4 gap-2">
            <UButton v-for="qty in quickQuantities" :key="qty" :color="state.quantity === qty ? 'primary' : 'neutral'"
              :variant="state.quantity === qty ? 'solid' : 'outline'" :disabled="loading"
              @click="selectQuickQuantity(qty)">
              +{{ qty }}
            </UButton>
          </div>
        </div>

        <!-- Custom Quantity -->
        <UFormField label="Quantité personnalisée" name="quantity" required>
          <UInput v-model.number="state.quantity" type="number" min="1" placeholder="Entrez la quantité"
            :disabled="loading" class="w-full" />
        </UFormField>

        <!-- Notes -->
        <UFormField label="Notes (optionnel)" name="notes">
          <UTextarea v-model="state.notes" placeholder="Notes sur le réapprovisionnement..." :rows="2"
            :disabled="loading" class="w-full" maxlength="300" />
          <template #hint>
            <span class="text-xs" :class="notesRemaining < 50 ? 'text-orange-500' : 'text-gray-500'">
              {{ notesRemaining }} caractères restants
            </span>
          </template>
        </UFormField>

        <!-- New Stock Preview -->
        <div class="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-trending-up" class="h-5 w-5 text-green-600" />
              <span class="text-sm font-medium text-green-800 dark:text-green-200">
                Nouveau stock:
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-green-700 dark:text-green-300">
                {{ item.stock_quantity }}
              </span>
              <UIcon name="i-heroicons-arrow-right" class="h-4 w-4 text-green-600" />
              <span class="text-xl font-bold text-green-600">
                {{ newStockPreview }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <UButton label="Annuler" color="neutral" variant="ghost" :disabled="loading" @click="open = false" />

          <UButton label="Réapprovisionner" color="primary" type="submit" :loading="loading"
            :disabled="state.quantity <= 0" icon="i-heroicons-plus-circle" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
