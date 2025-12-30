<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { InventoryItem, AdjustStockPayload, StockOperation, StockReason } from '~/types/inventory'

const props = defineProps<{
  open: boolean
  item: InventoryItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

const { adjustStock, loading } = useInventories()
const toast = useToast()

const formRef = ref()

// ============================================================================
// OPTIONS
// ============================================================================

// IMPORTANT: Les valeurs doivent correspondre à l'Enum StockOperation du Backend (set, add, sub)
const operationOptions = [
  { label: 'Définir à', value: 'set', icon: 'i-heroicons-equals', description: 'Définir la quantité exacte' },
  { label: 'Ajouter (+)', value: 'add', icon: 'i-heroicons-plus', description: 'Ajouter au stock actuel' },
  { label: 'Retirer (-)', value: 'sub', icon: 'i-heroicons-minus', description: 'Retirer du stock actuel' }
]

const reasonOptions = [
  { label: 'Ajustement manuel', value: 'adjustment' },
  { label: 'Achat / Réception', value: 'sale' },
  { label: 'Retour client', value: 'return' },
  { label: 'Produit endommagé', value: 'damaged' },
  { label: 'Produit perdu', value: 'lost' },
  { label: 'Produit restocké', value: 'restock' }
]

// ============================================================================
// SCHEMA & VALIDATION
// ============================================================================

const schema = z.object({
  operation: z.enum(['set', 'add', 'sub'] satisfies StockOperation[]),
  quantity: z
    .number()
    .int('La quantité doit être un nombre entier')
    .min(0, 'La quantité ne peut pas être négative'),
  reason: z.enum(['adjustment','sale','return','damaged','restock','lost'] satisfies StockReason[]),
  notes: z.string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .trim()
    .optional()
    .or(z.literal(''))
}).refine((data) => {
  // Règle 1: Si add/sub, quantité doit être > 0
  if (['add', 'sub'].includes(data.operation) && data.quantity === 0) {
    return false
  }
  return true
}, {
  message: 'La quantité doit être supérieure à 0 pour un ajout ou un retrait',
  path: ['quantity']
}).refine((data) => {
  // Règle 2: Le stock final ne doit pas être négatif
  if (!props.item) return true

  const currentStock = props.item.stock_quantity
  let newStock = currentStock

  switch (data.operation) {
    case 'set': newStock = data.quantity; break;
    case 'add': newStock = currentStock + data.quantity; break;
    case 'sub': newStock = currentStock - data.quantity; break;
  }

  return newStock >= 0
}, {
  message: 'Le stock résultant ne peut pas être négatif',
  path: ['quantity']
})

type AdjustStockFormSchema = z.infer<typeof schema>

// ============================================================================
// ÉTAT
// ============================================================================

const state = reactive<AdjustStockFormSchema>({
  operation: 'add', // Par défaut : ajout
  quantity: undefined as unknown as number, // Force l'utilisateur à saisir
  reason: 'adjustment',
  notes: ''
})

// ============================================================================
// COMPUTED
// ============================================================================

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const calculateNewStock = computed(() => {
  if (!props.item || state.quantity === undefined) return props.item?.stock_quantity ?? 0

  switch (state.operation) {
    case 'add':
      return props.item.stock_quantity + state.quantity
    case 'sub':
      return props.item.stock_quantity - state.quantity
    case 'set':
      return state.quantity
    default:
      return props.item.stock_quantity
  }
})

const isStockNegative = computed(() => calculateNewStock.value < 0)
const isNoChange = computed(() => ['add', 'sub'].includes(state.operation) && state.quantity === 0)

const notesLength = computed(() => state.notes?.length || 0)
const notesRemaining = computed(() => 500 - notesLength.value)

// ============================================================================
// LOGIQUE MÉTIER
// ============================================================================

function resetForm(): void {
  Object.assign(state, {
    operation: 'add',
    quantity: undefined,
    reason: 'adjustment',
    notes: ''
  })
}

/**
 * Soumission du formulaire
 * Construit le payload exact attendu par le Backend (InventoryService)
 */
async function onSubmit(event: FormSubmitEvent<AdjustStockFormSchema>): Promise<void> {
  if (!props.item) return

  try {
    const { quantity, operation, reason, notes } = event.data
    let payload: AdjustStockPayload

    // DÉTECTION DU TYPE D'AJUSTEMENT (CRITIQUE)
    // Si l'item a un 'variation_id' (dans le contexte de la table) OU type === 'variation'
    // Alors c'est une variation spécifique.
    // Le backend exige que les variations soient envoyées dans un tableau `variations`.

    const isVariation = props.item.type === 'variation' || !!props.item.variation_id

    if (isVariation) {
      // Cas 1: Variation Spécifique -> Structure "VariableStockAdjustment"
      // On doit envoyer l'ID du parent dans `product_id` et l'ID de la variation dans le tableau
      payload = {
        product_id: props.item.product_id, // ID du Parent
        reason: reason as any,
        notes: notes || null,
        variations: [
          {
            id: props.item.id, // ID de la Variation (ou item.variation_id selon la source)
            quantity: quantity,
            operation: operation as StockOperation
          }
        ]
      }
    } else {
      // Cas 2: Produit Simple -> Structure "SimpleStockAdjustment"
      payload = {
        product_id: props.item.id, // ID du Produit Simple
        reason: reason as any,
        notes: notes || null,
        quantity: quantity,
        operation: operation as StockOperation
      }
    }

    console.log('Payload ajustement stock:', payload)

    // Appel API via le composable
    const success = await adjustStock(payload)

    if (success) {
      isOpen.value = false
      emit('success')
      resetForm()
    }
  } catch (error) {
    console.error('Erreur submission stock:', error)
    // L'erreur est déjà gérée par le composable (toast)
  }
}

function handleModalClose(): void {
  resetForm()
}

async function handleSubmit(): Promise<void> {
  if (formRef.value) {
    await formRef.value.submit()
  }
}

// Watchers
watch(isOpen, (value) => {
  if (value && props.item) {
    resetForm()
  }
})
</script>

<template>
  <UModal v-model:open="isOpen" title="Ajuster le stock" description="Modifier la quantité en stock"
    :prevent-close="loading" @after:leave="handleModalClose">
    <template #body>
      <UForm v-if="item" ref="formRef" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <!-- Info Produit (Header) -->
        <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-start gap-3">
            <!-- Image -->
            <div
              class="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="h-full w-full object-cover" />
              <div v-else class="h-full w-full flex items-center justify-center text-gray-400">
                <UIcon name="i-heroicons-photo" class="h-6 w-6" />
              </div>
            </div>

            <!-- Détails -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ item.name }}
                </p>
                <UBadge v-if="item.type === 'variation'" label="Variation" color="secondary" variant="subtle" size="xs" />
              </div>
              <p class="text-sm text-gray-500 font-mono mt-0.5">
                SKU: {{ item.sku }}
              </p>
            </div>

            <!-- Stock Actuel (Grand) -->
            <div class="text-right">
              <span class="block text-xs text-gray-500 uppercase font-bold tracking-wider">Actuel</span>
              <span class="text-xl font-bold font-mono"
                :class="item.stock_quantity > 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'">
                {{ item.stock_quantity }}
              </span>
            </div>
          </div>
        </div>

        <!-- Opération et Quantité -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Opération" name="operation">
            <USelectMenu v-model="state.operation" :items="operationOptions" value-key="value" :disabled="loading"
              class="w-full">
              <template #leading>
                <UIcon v-if="state.operation"
                  :name="operationOptions.find(o => o.value === state.operation)?.icon || ''"
                  class="size-4 text-gray-500" />
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField label="Quantité" name="quantity">
            <UInput v-model.number="state.quantity" type="number" min="0" placeholder="0" :disabled="loading"
              class="w-full" :ui="{ base: 'text-right font-mono' }" autofocus />
          </UFormField>
        </div>

        <!-- Simulation du nouveau stock -->
        <div class="flex items-center justify-between px-1 py-2">
          <span class="text-sm text-gray-500">Nouveau stock estimé :</span>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-400" />
            <span class="font-mono font-bold text-lg transition-colors duration-200" :class="[
              isStockNegative ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400',
              isNoChange ? 'opacity-50' : ''
            ]">
              {{ calculateNewStock }}
            </span>
          </div>
        </div>

        <!-- Raison -->
        <UFormField label="Raison de l'ajustement" name="reason" required>
          <USelectMenu v-model="state.reason" :items="reasonOptions" value-key="value" placeholder="Sélectionner..."
            :disabled="loading" class="w-full" />
        </UFormField>

        <!-- Notes -->
        <UFormField label="Notes / Commentaire" name="notes">
          <UTextarea v-model="state.notes" placeholder="Référence commande, détail du dommage..." :rows="3"
            :disabled="loading" class="w-full" />
          <template #hint>
            <span class="text-xs" :class="notesRemaining < 50 ? 'text-orange-500' : 'text-gray-400'">
              {{ notesRemaining }} / 500
            </span>
          </template>
        </UFormField>

        <!-- Messages d'erreur visuels -->
        <div v-if="isStockNegative"
          class="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 shrink-0" />
          <span>Attention : Cette opération rendrait le stock négatif.</span>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <UButton label="Annuler" color="neutral" variant="ghost" :disabled="loading" @click="isOpen = false" />
        <UButton label="Valider l'ajustement" color="primary" :loading="loading"
          :disabled="isStockNegative || isNoChange" @click="handleSubmit" />
      </div>
    </template>
  </UModal>
</template>