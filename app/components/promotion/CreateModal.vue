<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const emit = defineEmits<{
  created: []
}>()

const { createPromotion, loading } = usePromotions()

const open = ref(false)

// Types de promotions disponibles
const typeOptions = [
  { label: 'Pourcentage', value: 'percentage', icon: 'i-lucide-percent', description: 'Réduction en pourcentage' },
  { label: 'Montant fixe', value: 'fixed_amount', icon: 'i-lucide-coins', description: 'Montant fixe en FCFA' },
  { label: 'Achetez X obtenez Y', value: 'buy_x_get_y', icon: 'i-lucide-gift', description: 'Offre sur quantité' }
]

// Validation de dates avec messages personnalisés
const now = new Date()
now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
const minDate = now.toISOString().slice(0, 16)

// Schéma de validation amélioré avec validation conditionnelle
const schema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .trim(),
  code: z.string()
    .min(3, 'Le code doit contenir au moins 3 caractères')
    .max(50, 'Le code ne peut pas dépasser 50 caractères')
    .regex(/^[A-Z0-9]+$/, 'Le code doit contenir uniquement des lettres majuscules et chiffres')
    .trim()
    .optional()
    .or(z.literal('')),
  description: z.string()
    .max(300, 'La description ne peut pas dépasser 300 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  type: z.enum(['percentage', 'fixed_amount', 'buy_x_get_y']),
  value: z.number()
    .int('La valeur doit être un nombre entier')
    .min(0, 'La valeur doit être positive'),
  min_purchase_amount: z.number()
    .int('Le montant doit être un nombre entier')
    .min(0, 'Le montant minimum doit être positif')
    .optional()
    .nullable(),
  max_discount_amount: z.number()
    .int('Le montant doit être un nombre entier')
    .min(0, 'Le montant maximum doit être positif')
    .optional()
    .nullable(),
  usage_limit: z.number()
    .int()
    .min(5, 'La limite doit être au moins 5')
    .optional()
    .nullable()
    .or(z.literal(undefined)),
  usage_limit_per_customer: z.number()
    .int()
    .min(1, 'La limite par client doit être au moins 1')
    .default(1),
  is_active: z.boolean().default(true),
  starts_at: z.string()
    .optional()
    .nullable(),
  expires_at: z.string()
    .optional()
    .nullable(),
  // Champs spécifiques pour buy_x_get_y
  buy_quantity: z.number().int().min(1).optional().nullable(),
  get_quantity: z.number().int().min(1).optional().nullable(),
}).refine((data) => {
  // Validation spécifique pour percentage et buy_x_get_y
  if (data.type === 'percentage' || data.type === 'buy_x_get_y') {
    return data.value <= 100
  }
  return true
}, {
  message: 'Le pourcentage ne peut pas dépasser 100%',
  path: ['value']
}).refine((data) => {
  // Validation pour fixed_amount (multiples de 500)
  if (data.type === 'fixed_amount' && data.value > 0) {
    return data.value % 500 === 0
  }
  return true
}, {
  message: 'Le montant doit être un multiple de 500 FCFA',
  path: ['value']
}).refine((data) => {
  // Valider que la date de fin est après la date de début
  if (data.starts_at && data.expires_at) {
    return new Date(data.expires_at) > new Date(data.starts_at)
  }
  return true
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['expires_at']
}).refine((data) => {
  // Valider les champs buy_x_get_y
  if (data.type === 'buy_x_get_y') {
    return data.buy_quantity && data.get_quantity
  }
  return true
}, {
  message: 'Les quantités achat/offert sont obligatoires pour ce type',
  path: ['buy_quantity']
}).refine((data) => {
  // Validation des multiples de 500 pour min_purchase_amount
  if (data.min_purchase_amount && data.min_purchase_amount > 0) {
    return data.min_purchase_amount % 500 === 0
  }
  return true
}, {
  message: 'Le montant minimum doit être un multiple de 500 FCFA',
  path: ['min_purchase_amount']
}).refine((data) => {
  // Validation des multiples de 500 pour max_discount_amount
  if (data.max_discount_amount && data.max_discount_amount > 0) {
    return data.max_discount_amount % 500 === 0
  }
  return true
}, {
  message: 'Le montant maximum doit être un multiple de 500 FCFA',
  path: ['max_discount_amount']
})

type PromotionFormSchema = z.infer<typeof schema>

// État du formulaire
const state = reactive<Partial<PromotionFormSchema>>({
  name: '',
  code: '',
  description: '',
  type: 'percentage',
  value: 10,
  min_purchase_amount: null,
  max_discount_amount: null,
  usage_limit: null,
  usage_limit_per_customer: 1,
  is_active: true,
  starts_at: null,
  expires_at: null,
  buy_quantity: null,
  get_quantity: null,
})

const defaultState: Partial<PromotionFormSchema> = {
  name: '',
  code: '',
  description: '',
  type: 'percentage',
  value: 10,
  min_purchase_amount: null,
  max_discount_amount: null,
  usage_limit: null,
  usage_limit_per_customer: 1,
  is_active: true,
  starts_at: null,
  expires_at: null,
  buy_quantity: null,
  get_quantity: null,
}

// Computed
const isPercentage = computed(() => state.type === 'percentage')
const isFixedAmount = computed(() => state.type === 'fixed_amount')
const isBuyXGetY = computed(() => state.type === 'buy_x_get_y')

const maxValue = computed(() => {
  if (isPercentage.value || isBuyXGetY.value) return 100
  return 10000000 // 10M FCFA max pour montant fixe
})

const descriptionLength = computed(() => state.description?.length || 0)
const descriptionRemaining = computed(() => 300 - descriptionLength.value)

function generateRandomCode() {
  state.code = generatePromotionCode('PROMO', 8)
}

watch(() => state.code, (newCode) => {
  if (newCode) {
    state.code = normalizePromotionCode(newCode)
  }
})

// Ajuster la valeur selon le type
watch(() => state.type, (newType) => {
  // Si on passe à percentage ou buy_x_get_y et que la valeur dépasse 100
  if ((newType === 'percentage' || newType === 'buy_x_get_y') && state.value && state.value > 100) {
    state.value = 10
  }
  // Si on passe à fixed_amount avec une petite valeur
  if (newType === 'fixed_amount' && (!state.value || state.value <= 100)) {
    state.value = 5000
  }
})

function resetForm() {
  Object.assign(state, defaultState)
}

async function onSubmit(event: FormSubmitEvent<PromotionFormSchema>) {
  try {
    const payload: Record<string, any> = {
      name: event.data.name,
      code: event.data.code || null,
      description: event.data.description || null,
      type: event.data.type,
      value: event.data.value,
      min_purchase_amount: event.data.min_purchase_amount || null,
      max_discount_amount: event.data.max_discount_amount || null,
      usage_limit: event.data.usage_limit || null,
      usage_limit_per_customer: event.data.usage_limit_per_customer,
      is_active: event.data.is_active,
      starts_at: event.data.starts_at || null,
      expires_at: event.data.expires_at || null,
    }

    // Ajouter metadata pour buy_x_get_y
    if (event.data.type === 'buy_x_get_y') {
      payload.metadata = {
        buy_quantity: event.data.buy_quantity,
        get_quantity: event.data.get_quantity,
        discount_on_y: event.data.value,
      }
    }

    const success = await createPromotion(payload)
    if (success) {
      open.value = false
      emit('created')
      resetForm()
    }
  } catch (error) {
    console.error('Erreur lors de la création:', error)
  }
}

function handleModalClose() {
  resetForm()
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Nouvelle promotion"
    description="Créer une nouvelle promotion ou code promo"
    :ui="{ content: 'min-w-[60%]' }"
    @close="handleModalClose"
  >
    <UButton label="Nouvelle promotion" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="p-4 space-y-4"
        @submit="onSubmit"
      >
        <!-- Informations de base -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nom de la promotion" name="name" required>
            <UInput
              v-model="state.name"
              placeholder="Soldes d'été 2025"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Code promo" name="code">
            <UInput
              v-model="state.code"
              placeholder="SUMMER2025"
              :disabled="loading"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  icon="i-lucide-shuffle"
                  color="neutral"
                  variant="link"
                  size="xs"
                  :padded="false"
                  @click="generateRandomCode"
                />
              </template>
            </UInput>
            <template #hint>
              <span class="text-xs text-gray-500">Optionnel • Lettres majuscules et chiffres uniquement</span>
            </template>
          </UFormField>
        </div>

        <UFormField label="Description" name="description">
          <UTextarea
            v-model="state.description"
            :rows="2"
            placeholder="Description de la promotion..."
            :disabled="loading"
            class="w-full"
            maxlength="300"
          />
          <template #hint>
            <span
              class="text-xs"
              :class="descriptionRemaining < 50 ? 'text-orange-500' : 'text-gray-500'"
            >
              {{ descriptionRemaining }} caractères restants
            </span>
          </template>
        </UFormField>

        <!-- Type et valeur -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Type de réduction" name="type" required>
            <USelectMenu
              v-model="state.type"
              :items="typeOptions"
              value-key="value"
              class="w-full"
            >
              <template #leading>
                <UIcon
                  v-if="state.type"
                  :name="typeOptions.find(t => t.value === state.type)?.icon || 'i-lucide-tag'"
                  class="size-4"
                />
              </template>
              <template #item="{ item }">
                <div class="flex items-center gap-2">
                  <UIcon :name="item.icon" class="size-4 shrink-0" />
                  <div class="flex flex-col flex-1">
                    <span class="font-medium text-sm">{{ item.label }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</span>
                  </div>
                </div>
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField
            v-if="!isBuyXGetY"
            :label="isPercentage ? 'Pourcentage de réduction (%)' : 'Montant de réduction (FCFA)'"
            name="value"
            required
          >
            <UInput
              v-model.number="state.value"
              type="number"
              :min="0"
              :max="maxValue"
              :step="isFixedAmount ? 500 : 1"
              :disabled="loading"
              class="w-full"
            />
            <template #hint>
              <span class="text-xs text-gray-500">
                {{ isPercentage ? 'Entre 0 et 100%' : 'Bonds de 500 FCFA' }}
              </span>
            </template>
          </UFormField>
        </div>

        <!-- Section Buy X Get Y -->
        <div v-if="isBuyXGetY" class="border border-primary-200 dark:border-primary-800 rounded-lg p-4 bg-primary-50 dark:bg-primary-950/50">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-gift" class="size-5 text-primary-600" />
            <h4 class="text-sm font-medium text-primary-900 dark:text-primary-100">Configuration Buy X Get Y</h4>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <UFormField label="Quantité à acheter" name="buy_quantity" required>
              <UInput
                v-model.number="state.buy_quantity"
                type="number"
                min="1"
                placeholder="2"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">Ex: Achetez 2</span>
              </template>
            </UFormField>

            <UFormField label="Quantité offerte" name="get_quantity" required>
              <UInput
                v-model.number="state.get_quantity"
                type="number"
                min="1"
                placeholder="1"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">Ex: Obtenez 1</span>
              </template>
            </UFormField>

            <UFormField label="Réduction sur Y (%)" name="value" required>
              <UInput
                v-model.number="state.value"
                type="number"
                min="0"
                max="100"
                placeholder="100"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">100% = gratuit</span>
              </template>
            </UFormField>
          </div>

          <div class="mt-3 p-2 bg-white dark:bg-gray-900 rounded border border-primary-200 dark:border-primary-800">
            <p class="text-xs text-gray-600 dark:text-gray-400">
              <UIcon name="i-lucide-info" class="size-3 inline" />
              <strong>Exemple:</strong>
              {{ state.buy_quantity || 'X' }} achetés + {{ state.get_quantity || 'Y' }} avec {{ state.value || 0 }}% de réduction
              {{ state.value === 100 ? '(gratuit)' : '' }}
            </p>
          </div>
        </div>

        <!-- Limites -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">Conditions d'application</h4>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Montant minimum d'achat (FCFA)" name="min_purchase_amount">
              <UInput
                v-model.number="state.min_purchase_amount"
                type="number"
                min="0"
                step="500"
                placeholder="0"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">Bonds de 500 FCFA</span>
              </template>
            </UFormField>

            <UFormField label="Réduction maximale (FCFA)" name="max_discount_amount">
              <UInput
                v-model.number="state.max_discount_amount"
                type="number"
                min="0"
                step="500"
                placeholder="Illimité"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">Optionnel • Bonds de 500 FCFA</span>
              </template>
            </UFormField>
          </div>
        </div>

        <!-- Limites d'utilisation -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">Limites d'utilisation</h4>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Utilisation totale maximale" name="usage_limit">
              <UInput
                v-model.number="state.usage_limit"
                type="number"
                min="5"
                step="5"
                placeholder="Illimité"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">Minimum 5 utilisations • Bonds de 5</span>
              </template>
            </UFormField>

            <UFormField label="Utilisation par client" name="usage_limit_per_customer">
              <UInput
                v-model.number="state.usage_limit_per_customer"
                type="number"
                min="1"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">Minimum 1 par client</span>
              </template>
            </UFormField>
          </div>
        </div>

        <!-- Dates -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">Période de validité</h4>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Date de début" name="starts_at">
              <UInput
                v-model="state.starts_at"
                type="datetime-local"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">Optionnel</span>
              </template>
            </UFormField>

            <UFormField label="Date de fin" name="expires_at">
              <UInput
                v-model="state.expires_at"
                type="datetime-local"
                :min="state.starts_at || undefined"
                :disabled="loading"
                class="w-full"
              />
              <template #hint>
                <span class="text-xs text-gray-500">
                  {{ state.starts_at ? 'Doit être après la date de début' : 'Optionnel' }}
                </span>
              </template>
            </UFormField>
          </div>
        </div>

        <!-- Statut -->
        <div class="border-t pt-4">
          <UFormField name="is_active">
            <USwitch
              v-model="state.is_active"
              label="Activer la promotion immédiatement"
            />
            <template #hint>
              <span class="text-xs text-gray-500">
                {{ state.is_active ? 'La promotion sera active dès sa création' : 'La promotion sera créée mais désactivée' }}
              </span>
            </template>
          </UFormField>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            label="Créer la promotion"
            color="primary"
            type="submit"
            :loading="loading"
            icon="i-lucide-check"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
