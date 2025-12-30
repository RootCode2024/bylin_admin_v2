<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()

const open = defineModel<boolean>('open', { required: true })
const loading = ref(false)

// Options de fréquence
const frequencyOptions = [
  { label: 'En temps réel', value: 'realtime', description: 'Notification immédiate' },
  { label: 'Toutes les heures', value: 'hourly', description: 'Résumé toutes les heures' },
  { label: 'Une fois par jour', value: 'daily', description: 'Résumé quotidien à 9h' },
  { label: 'Une fois par semaine', value: 'weekly', description: 'Résumé hebdomadaire le lundi' }
]

// Schéma de validation
const schema = z.object({
  email_low_stock: z.boolean(),
  email_out_of_stock: z.boolean(),
  email_daily_summary: z.boolean(),
  push_low_stock: z.boolean(),
  push_out_of_stock: z.boolean(),
  default_low_stock_threshold: z.number()
    .int('Le seuil doit être un nombre entier')
    .min(1, 'Le seuil doit être au moins 1')
    .max(1000, 'Le seuil ne peut pas dépasser 1000'),
  alert_emails: z.string()
    .trim()
    .optional()
    .or(z.literal('')),
  alert_frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly'])
})

type NotificationSettingsSchema = z.infer<typeof schema>

// État du formulaire
const state = reactive<NotificationSettingsSchema>({
  email_low_stock: true,
  email_out_of_stock: true,
  email_daily_summary: false,
  push_low_stock: true,
  push_out_of_stock: true,
  default_low_stock_threshold: 10,
  alert_emails: '',
  alert_frequency: 'realtime'
})

const defaultState: NotificationSettingsSchema = {
  email_low_stock: true,
  email_out_of_stock: true,
  email_daily_summary: false,
  push_low_stock: true,
  push_out_of_stock: true,
  default_low_stock_threshold: 10,
  alert_emails: '',
  alert_frequency: 'realtime'
}

// Methods
function resetToDefaults() {
  Object.assign(state, defaultState)
  toast.add({
    title: 'Paramètres réinitialisés',
    description: 'Les paramètres par défaut ont été restaurés',
    color: 'info',
    icon: 'i-heroicons-arrow-path'
  })
}

async function onSubmit(event: FormSubmitEvent<NotificationSettingsSchema>) {
  loading.value = true

  try {
    // TODO: Envoyer au backend
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.add({
      title: 'Paramètres enregistrés',
      description: 'Vos préférences d\'alertes ont été mises à jour',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    open.value = false
  } catch (error) {
    toast.add({
      title: 'Erreur',
      description: 'Impossible d\'enregistrer les paramètres',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    loading.value = false
  }
}

function handleModalClose() {
  // Optionnel: recharger les paramètres depuis le serveur
}

// Load settings on mount
onMounted(async () => {
  // TODO: Charger depuis le backend
})
</script>

<template>
  <UModal v-model:open="open" title="Paramètres d'alertes de stock"
    description="Configurez vos notifications pour la gestion du stock" :ui="{ content: 'min-w-[50%]' }"
    @close="handleModalClose">
    <template #body>
      <UForm :schema="schema" :state="state" class="p-4 space-y-6" @submit="onSubmit">
        <!-- Email Notifications -->
        <div>
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-envelope" class="size-4" />
            Notifications par email
          </h4>

          <div class="space-y-3">
            <UFormField name="email_low_stock">
              <UCheckbox v-model="state.email_low_stock" label="M'alerter quand un produit a un stock faible" />
            </UFormField>

            <UFormField name="email_out_of_stock">
              <UCheckbox v-model="state.email_out_of_stock" label="M'alerter quand un produit est en rupture" />
            </UFormField>

            <UFormField name="email_daily_summary">
              <UCheckbox v-model="state.email_daily_summary" label="Recevoir un résumé quotidien de l'inventaire" />
            </UFormField>
          </div>
        </div>

        <!-- Push Notifications -->
        <div class="border-t pt-6">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-bell" class="size-4" />
            Notifications push
          </h4>

          <div class="space-y-3">
            <UFormField name="push_low_stock">
              <UCheckbox v-model="state.push_low_stock" label="Notification instantanée pour stock faible" />
            </UFormField>

            <UFormField name="push_out_of_stock">
              <UCheckbox v-model="state.push_out_of_stock" label="Notification instantanée pour rupture" />
            </UFormField>
          </div>
        </div>

        <!-- Thresholds -->
        <div class="border-t pt-6">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-adjustments-horizontal" class="size-4" />
            Seuils par défaut
          </h4>

          <UFormField label="Seuil de stock faible" name="default_low_stock_threshold"
            description="Appliqué aux nouveaux produits sans seuil défini">
            <UInput v-model.number="state.default_low_stock_threshold" type="number" min="1" max="1000"
              :disabled="loading" class="w-full">
              <template #trailing>
                <span class="text-xs text-gray-500">unités</span>
              </template>
            </UInput>
          </UFormField>
        </div>

        <!-- Alert Recipients -->
        <div class="border-t pt-6">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="size-4" />
            Destinataires des alertes
          </h4>

          <UFormField label="Emails supplémentaires" name="alert_emails"
            description="Adresses emails séparées par des virgules">
            <UTextarea v-model="state.alert_emails" placeholder="email1@example.com, email2@example.com" :rows="2"
              :disabled="loading" class="w-full" />
          </UFormField>
        </div>

        <!-- Alert Frequency -->
        <div class="border-t pt-6">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="size-4" />
            Fréquence des alertes
          </h4>

          <UFormField name="alert_frequency">
            <USelectMenu v-model="state.alert_frequency" :items="frequencyOptions" value-key="value" :disabled="loading"
              class="w-full">
              <template #item="{ item }">
                <div class="flex flex-col">
                  <span class="font-medium text-sm">{{ item.label }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</span>
                </div>
              </template>
            </USelectMenu>
          </UFormField>
        </div>

        <!-- Info Box -->
        <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <div class="flex gap-3">
            <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-blue-600 shrink-0" />
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p class="font-medium mb-1">À propos des notifications</p>
              <p class="text-xs">
                Les notifications vous aident à gérer votre stock efficacement.
                Vous pouvez les désactiver à tout moment.
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <UButton label="Réinitialiser" color="error" variant="ghost" icon="i-heroicons-arrow-path" :disabled="loading"
            @click="resetToDefaults" />

          <div class="flex gap-3">
            <UButton label="Annuler" color="neutral" variant="ghost" :disabled="loading" @click="open = false" />

            <UButton label="Enregistrer" color="primary" type="submit" :loading="loading" icon="i-heroicons-check" />
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
