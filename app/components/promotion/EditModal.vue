<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Promotion } from '~/types/promotion'

const props = defineProps<{
  promotion: Promotion | null
}>()

const emit = defineEmits<{
  updated: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { updatePromotion, loading } = usePromotions()

const typeOptions = [
  { label: 'Pourcentage', value: 'percentage', icon: 'i-lucide-percent' },
  { label: 'Montant fixe', value: 'fixed_amount', icon: 'i-lucide-coins' },
  { label: 'Achetez X obtenez Y', value: 'buy_x_get_y', icon: 'i-lucide-gift' }
]

const schema = z.object({
  name: z.string().min(2).max(255).trim(),
  code: z.string().min(3).max(50).regex(/^[A-Z0-9]+$/).trim().optional().or(z.literal('')),
  description: z.string().max(1000).trim().optional().or(z.literal('')),
  type: z.enum(['percentage', 'fixed_amount', 'buy_x_get_y']),
  value: z.number().min(0),
  min_purchase_amount: z.number().min(0).optional().nullable(),
  max_discount_amount: z.number().min(0).optional().nullable(),
  usage_limit: z.number().int().min(1).optional().nullable(),
  usage_limit_per_customer: z.number().int().min(1),
  is_active: z.boolean(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
})

type PromotionFormSchema = z.infer<typeof schema>

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

const isPercentage = computed(() => state.type === 'percentage')
const maxValue = computed(() => isPercentage.value ? 100 : 1000000)

// Watcher pour charger les données
watch(() => props.promotion, (promo) => {
  if (promo && open.value) {
    state.name = promo.name
    state.code = promo.code || ''
    state.description = promo.description || ''
    state.type = promo.type
    state.value = promo.value
    state.min_purchase_amount = promo.min_purchase_amount
    state.max_discount_amount = promo.max_discount_amount
    state.usage_limit = promo.usage_limit
    state.usage_limit_per_customer = promo.usage_limit_per_customer
    state.is_active = promo.is_active
    state.starts_at = promo.starts_at ? promo.starts_at.substring(0, 16) : null
    state.expires_at = promo.expires_at ? promo.expires_at.substring(0, 16) : null
  }
}, { immediate: true })

watch(() => state.code, (newCode) => {
  if (newCode) {
    state.code = normalizePromotionCode(newCode)
  }
})

watch(() => state.type, (newType) => {
  if (newType === 'percentage' && state.value && state.value > 100) {
    state.value = 100
  }
})

async function onSubmit(event: FormSubmitEvent<PromotionFormSchema>) {
  if (!props.promotion) return

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

    const success = await updatePromotion(props.promotion.id, payload)
    if (success) {
      open.value = false
      emit('updated')
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Modifier la promotion"
    :description="`Modification de la promotion ${promotion?.name || ''}`" :ui="{ content: 'min-w-[60%]' }">
    <template #body>
      <UForm v-if="promotion" :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nom de la promotion" name="name" required>
            <UInput v-model="state.name" :disabled="loading" />
          </UFormField>

          <UFormField label="Code promo" name="code">
            <UInput v-model="state.code" :disabled="loading" />
            <template #hint>
              <span class="text-xs text-gray-500">Optionnel • Lettres majuscules et chiffres uniquement</span>
            </template>
          </UFormField>
        </div>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" :rows="2" :disabled="loading" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Type de réduction" name="type" required>
            <USelectMenu v-model="state.type" :items="typeOptions" value-key="value" label-key="label">
              <template #leading>
                <UIcon v-if="state.type" :name="typeOptions.find(t => t.value === state.type)?.icon || 'i-lucide-tag'"
                  class="size-4" />
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField :label="isPercentage ? 'Pourcentage (%)' : 'Montant (FCFA)'" name="value" required>
            <UInput v-model.number="state.value" type="number" :min="0" :max="maxValue" :disabled="loading" />
          </UFormField>
        </div>

        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">Conditions d'application</h4>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Montant minimum (FCFA)" name="min_purchase_amount">
              <UInput v-model.number="state.min_purchase_amount" type="number" min="0" :disabled="loading" />
            </UFormField>

            <UFormField label="Réduction maximale (FCFA)" name="max_discount_amount">
              <UInput v-model.number="state.max_discount_amount" type="number" min="0" :disabled="loading" />
            </UFormField>
          </div>
        </div>

        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">Limites d'utilisation</h4>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Utilisation totale" name="usage_limit">
              <UInput v-model.number="state.usage_limit" type="number" min="1" :disabled="loading" />
              <template #hint>
                <span class="text-xs text-gray-500">
                  Utilisé : {{ promotion.usage_count }} fois
                </span>
              </template>
            </UFormField>

            <UFormField label="Par client" name="usage_limit_per_customer">
              <UInput v-model.number="state.usage_limit_per_customer" type="number" min="1" :disabled="loading" />
            </UFormField>
          </div>
        </div>

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

        <div class="border-t pt-4">
          <UFormField name="is_active">
            <USwitch v-model="state.is_active" label="Promotion active" />
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="open = false" />
          <UButton label="Mettre à jour" color="primary" type="submit" :loading="loading" icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
