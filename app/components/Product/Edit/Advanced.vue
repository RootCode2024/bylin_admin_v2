<script setup lang="ts">
import type { ApiResponse } from '~/types/product'
import { useProductFormStore } from '~/stores/productForm'

const props = defineProps<{
  productId?: string
  mode: 'create' | 'edit'
}>()

const productFormStore = useProductFormStore()
const { brands } = useBrands()
const client = useSanctumClient()

// ✅ Vérifier si c'est la marque Bylin
const isBylinBrand = computed(() => {
  const selectedBrand = brands.value.find(b => b.id === productFormStore.formData.brand_id)
  return selectedBrand?.slug === 'bylin'
})

// ✅ Statistiques des codes d'authenticité (mode edit uniquement)
const authenticityStats = ref<{
  total: number
  activated: number
  unactivated: number
} | null>(null)

const isLoadingStats = ref(false)

// ✅ Computed pour afficher les changements en temps réel
const codesChangeMessage = computed(() => {
  if (!authenticityStats.value || props.mode === 'create') return null

  const requested = productFormStore.formData.authenticity_codes_count || 0
  const current = authenticityStats.value.total
  const activated = authenticityStats.value.activated

  if (requested > current) {
    const diff = requested - current
    return {
      type: 'add',
      message: `✅ ${diff} nouveau${diff > 1 ? 'x' : ''} code${diff > 1 ? 's' : ''} sera${diff > 1 ? 'ont' : ''} généré${diff > 1 ? 's' : ''}`,
      color: 'success'
    }
  }

  if (requested < activated) {
    return {
      type: 'error',
      message: `⚠️ Impossible: ${activated} codes sont déjà activés`,
      color: 'error'
    }
  }

  if (requested < current) {
    const diff = current - requested
    return {
      type: 'remove',
      message: `🗑️ ${diff} code${diff > 1 ? 's' : ''} non activé${diff > 1 ? 's' : ''} sera${diff > 1 ? 'ont' : ''} supprimé${diff > 1 ? 's' : ''}`,
      color: 'warning'
    }
  }

  return {
    type: 'none',
    message: 'ℹ️ Aucun changement',
    color: 'neutral'
  }
})

// Charger les stats si mode édition
watch(() => [props.mode, props.productId, productFormStore.formData.requires_authenticity], async () => {
  if (props.mode === 'edit' && props.productId && productFormStore.formData.requires_authenticity && isBylinBrand.value) {
    await loadAuthenticityStats()
  }
}, { immediate: true })

async function loadAuthenticityStats() {
  if (!props.productId) return

  isLoadingStats.value = true
  try {
    const response = await client<ApiResponse<{
      total: number
      activated: number
      unactivated: number
    }>>(`/api/v1/admin/products/${props.productId}/authenticity/stats`)

    if (response.success) {
      authenticityStats.value = response.data
    }
  } catch (error) {
    console.error('Erreur chargement stats:', error)
  } finally {
    isLoadingStats.value = false
  }
}

// Dates min/max pour la précommande
const tomorrow = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

const oneYearLater = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().split('T')[0]
})
</script>

<template>
  <div class="space-y-6 p-6">
    <UFormField label="Configuration avancée">
      <div class="space-y-4">

        <!-- Authentification Bylin -->
        <div v-if="isBylinBrand" class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex-1">
              <p class="font-medium text-sm text-gray-900 dark:text-white">
                Authentification Bylin requise
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Générer des codes QR d'authenticité pour ce produit
              </p>
            </div>
            <USwitch
:model-value="productFormStore.formData.requires_authenticity"
              @update:model-value="productFormStore.setFormData({ requires_authenticity: $event })" />
          </div>

          <div
v-if="productFormStore.formData.requires_authenticity"
            class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">

            <!-- Statistiques actuelles (mode édition) -->
            <div v-if="mode === 'edit' && authenticityStats" class="grid grid-cols-3 gap-3">
              <div class="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p class="text-xs text-gray-600">Total codes</p>
                <p class="text-lg font-bold text-blue-600">{{ authenticityStats.total }}</p>
              </div>

              <div class="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p class="text-xs text-gray-600">Activés</p>
                <p class="text-lg font-bold text-green-600">{{ authenticityStats.activated }}</p>
              </div>

              <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p class="text-xs text-gray-600">Disponibles</p>
                <p class="text-lg font-bold text-gray-600">{{ authenticityStats.unactivated }}</p>
              </div>
            </div>

            <!-- Nombre de codes -->
            <UFormField label="Nombre de codes d'authenticité">
              <UInput
:model-value="productFormStore.formData.authenticity_codes_count"
                type="number"
                min="1"
max="10000"
:placeholder="mode === 'create' ? '10' : 'Modifier le nombre'"
class="w-1/2"
                @update:model-value="productFormStore.setFormData({ authenticity_codes_count: Number($event) })">
                <template #trailing>
                  <span class="text-gray-400 text-xs">codes</span>
                </template>
              </UInput>

              <template #hint>
                <div class="space-y-1">
                  <p v-if="codesChangeMessage" :class="`text-xs text-${codesChangeMessage.color}-600`">
                    {{ codesChangeMessage.message }}
                  </p>
                  <p v-else class="text-xs text-gray-500">
                    Entre 1 et 10 000 codes. Par défaut: 10
                  </p>
                </div>
              </template>
            </UFormField>

            <!-- Alerte si codes activés -->
            <UAlert
v-if="mode === 'edit' && authenticityStats && authenticityStats.activated > 0"
              icon="i-lucide-shield-check"
color="success"
variant="soft"
size="sm"
              :title="`${authenticityStats.activated} codes déjà activés`"
              description="Ces codes sont liés à des produits vendus et ne peuvent pas être supprimés." />
          </div>
        </div>

        <!-- Message si pas Bylin -->
        <UAlert
v-else-if="productFormStore.formData.requires_authenticity"
icon="i-lucide-info"
color="neutral"
          variant="soft"
title="Authentification réservée à Bylin"
          description="Les codes d'authenticité ne sont disponibles que pour les produits de la marque Bylin." />

        <!-- Produit variable -->
        <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="font-medium text-sm text-gray-900 dark:text-white">
                Produit avec variations
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Ce produit a différentes options (taille, couleur, etc.)
              </p>
            </div>
            <USwitch
:model-value="productFormStore.formData.is_variable"
              @update:model-value="productFormStore.setFormData({ is_variable: $event })" />
          </div>

          <div
v-if="productFormStore.formData.is_variable"
            class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <UAlert
icon="i-lucide-info"
color="primary"
variant="soft"
size="sm"
title="Variations activées"
              description="Vous pouvez maintenant gérer les variations dans l'onglet 'Variations'" />
          </div>
        </div>

        <!-- Précommande -->
        <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex-1">
              <p class="font-medium text-sm text-gray-900 dark:text-white">
                Activer la précommande
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Permettre aux clients de précommander ce produit
              </p>
            </div>
            <USwitch
:model-value="productFormStore.formData.is_preorder_enabled"
              @update:model-value="productFormStore.setFormData({ is_preorder_enabled: $event })" />
          </div>

          <div
v-if="productFormStore.formData.is_preorder_enabled"
            class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">

            <UFormField label="Date de disponibilité" required>
              <UInput
:model-value="productFormStore.formData.preorder_available_date"
                type="date"
:min="tomorrow"
                :max="oneYearLater"
class="w-1/2"
@update:model-value="productFormStore.setFormData({ preorder_available_date: $event })" />
              <template #hint>
                <span class="text-xs text-gray-500">
                  Date à laquelle le produit sera disponible (minimum demain, maximum 1 an)
                </span>
              </template>
            </UFormField>

            <UFormField label="Limite de précommandes">
              <UInput
:model-value="productFormStore.formData.preorder_limit"
                type="number"
                min="1"
placeholder="Illimité"
class="w-1/2"
@update:model-value="productFormStore.setFormData({ preorder_limit: $event ? Number($event) : undefined })">
                <template #trailing>
                  <span class="text-gray-400 text-xs">unités</span>
                </template>
              </UInput>
              <template #hint>
                <span class="text-xs text-gray-500">Laissez vide pour illimité</span>
              </template>
            </UFormField>

            <UFormField label="Message de précommande">
              <UTextarea
:model-value="productFormStore.formData.preorder_message"
                :rows="2"
placeholder="Ex: Disponible à partir du 15 janvier 2025"
                class="w-full"
@update:model-value="productFormStore.setFormData({ preorder_message: $event })" />
              <template #hint>
                <span class="text-xs text-gray-500">Message affiché sur la page produit</span>
              </template>
            </UFormField>

            <UFormField label="Conditions de précommande">
              <UTextarea
:model-value="productFormStore.formData.preorder_terms"
                :rows="3"
placeholder="Conditions générales de précommande..."
                class="w-full"
@update:model-value="productFormStore.setFormData({ preorder_terms: $event })" />
              <template #hint>
                <span class="text-xs text-gray-500">Conditions et informations légales</span>
              </template>
            </UFormField>
          </div>
        </div>
      </div>
    </UFormField>

    <!-- Info helper -->
    <UAlert
icon="i-lucide-lightbulb"
color="primary"
variant="soft"
title="Besoin d'aide ?">
      <template #description>
        <ul class="text-sm space-y-1 mt-2">
          <li>• <strong>Authentification</strong> : Réservée aux produits de marque nécessitant une vérification</li>
          <li>• <strong>Variations</strong> : Pour les produits avec plusieurs options (tailles, couleurs)</li>
          <li>• <strong>Précommande</strong> : Pour vendre un produit avant sa disponibilité</li>
        </ul>
      </template>
    </UAlert>
  </div>
</template>
