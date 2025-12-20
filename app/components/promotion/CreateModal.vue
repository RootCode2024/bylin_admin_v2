<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { generateCode, normalizeCode } from '~/utils/promotion'
import type { PromotionType } from '~/types/promotion'

const emit = defineEmits<{
  created: []
}>()

const { createPromotion, loading } = usePromotions()

const open = ref(false)

// Types de promotions disponibles
const typeOptions = [
  { label: 'Pourcentage', value: 'percentage', icon: 'i-lucide-percent' },
  { label: 'Montant fixe', value: 'fixed', icon: 'i-lucide-coins' },
  { label: 'Achetez X obtenez Y', value: 'buy_x_get_y', icon: 'i-lucide-gift' }
]

// Schéma de validation
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
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y']),
  value: z.number()
    .min(0, 'La valeur doit être positive')
    .max(100, 'Le pourcentage ne peut pas dépasser 100%'),
  min_purchase_amount: z.number()
    .min(0, 'Le montant minimum doit être positif')
    .optional()
    .nullable(),
  max_discount_amount: z.number()
    .min(0, 'Le montant maximum doit être positif')
    .optional()
    .nullable(),
  usage_limit: z.number()
    .int()
    .min(1, 'La limite doit être au moins 1')
    .optional()
    .nullable(),
  usage_limit_per_customer: z.number()
    .int()
    .min(1, 'La limite par client doit être au moins 1')
    .default(1),
  is_active: z.boolean().default(true),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
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
}

// Computed
const isPercentage = computed(() => state.type === 'percentage')

// Ajuster la validation de value selon le type
const maxValue = computed(() => isPercentage.value ? 100 : 1000000)

// Générer un code aléatoire
function generateRandomCode() {
  state.code = generateCode('PROMO', 8)
}

// Normaliser le code à chaque saisie
watch(() => state.code, (newCode) => {
  if (newCode) {
    state.code = normalizeCode(newCode)
  }
})

// Ajuster la valeur max si on passe de fixed à percentage
watch(() => state.type, (newType) => {
  if (newType === 'percentage' && state.value && state.value > 100) {
    state.value = 100
  }
})

function resetForm() {
  Object.assign(state, defaultState)
}

async function onSubmit(event: FormSubmitEvent<PromotionFormSchema>) {
  try {
    const payload = {
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
  <UModal v-model:open="open" title="Nouvelle promotion" description="Créer une nouvelle promotion ou code promo"
    :ui="{ content: 'min-w-[60%]' }" @close="handleModalClose">
    <UButton label="Nouvelle promotion" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <!-- Informations de base -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nom de la promotion" name="name" required>
            <UInput v-model="state.name" placeholder="Soldes d'été 2025" :disabled="loading" />
          </UFormField>

          <UFormField label="Code promo" name="code">
            <UInput v-model="state.code" placeholder="SUMMER2025" :disabled="loading">
              <template #trailing>
                <UButton icon="i-lucide-shuffle" color="neutral" variant="link" size="xs" @click="generateRandomCode"
                  :padded="false" />
              </template>
            </UInput>
            <template #hint>
              <span class="text-xs text-gray-500">Optionnel • Lettres majuscules et chiffres uniquement</span>
            </template>
          </UFormField>
        </div>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" :rows="2" placeholder="Description de la promotion..."
            :disabled="loading" />
        </UFormField>

        <!-- Type et valeur -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Type de réduction" name="type" required>
            <USelectMenu v-model="state.type" :items="typeOptions" value-key="value" label-key="label" class="w-full">
              <template #leading>
                <UIcon v-if="state.type" :name="typeOptions.find(t => t.value === state.type)?.icon || 'i-lucide-tag'"
                  class="size-4" />
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField :label="isPercentage ? 'Pourcentage de réduction (%)' : 'Montant de réduction (FCFA)'"
            name="value" required>
            <UInput v-model.number="state.value" type="number" :min="0" :max="maxValue" :step="isPercentage ? 1 : 100"
              :disabled="loading" />
          </UFormField>
        </div>

        <!-- Limites -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">Conditions d'application</h4>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Montant minimum d'achat (FCFA)" name="min_purchase_amount">
              <UInput v-model.number="state.min_purchase_amount" type="number" min="0" step="100" placeholder="0"
                :disabled="loading" />
            </UFormField>

            <UFormField label="Réduction maximale (FCFA)" name="max_discount_amount">
              <UInput v-model.number="state.max_discount_amount" type="number" min="0" step="100" placeholder="Illimité"
                :disabled="loading" />
            </UFormField>
          </div>
        </div>

        <!-- Limites d'utilisation -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">Limites d'utilisation</h4>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Utilisation totale maximale" name="usage_limit">
              <UInput v-model.number="state.usage_limit" type="number" min="1" placeholder="Illimité"
                :disabled="loading" />
            </UFormField>

            <UFormField label="Utilisation par client" name="usage_limit_per_customer">
              <UInput v-model.number="state.usage_limit_per_customer" type="number" min="1" :disabled="loading" />
            </UFormField>
          </div>
        </div>

        <!-- Dates -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">Période de validité</h4>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Date de début" name="starts_at">
              <UInput v-model="state.starts_at" type="datetime-local" :disabled="loading" />
            </UFormField>

            <UFormField label="Date de fin" name="expires_at">
              <UInput v-model="state.expires_at" type="datetime-local" :disabled="loading" />
            </UFormField>
          </div>
        </div>

        <!-- Statut -->
        <div class="border-t pt-4">
          <UFormField name="is_active">
            <USwitch v-model="state.is_active" label="Activer la promotion immédiatement" />
          </UFormField>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="open = false" />
          <UButton label="Créer la promotion" color="primary" type="submit" :loading="loading" icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
