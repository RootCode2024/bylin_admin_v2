<script setup lang="ts">
/**
 * Composant de suppression de produit(s)
 *
 * Modal de confirmation pour supprimer un ou plusieurs produits
 * Gère la suppression soft delete, restauration et suppression définitive
 */

// Props du composant
const props = defineProps<{
  open: boolean
  ids: string[]
}>()

// Événements émis par le composant
const emit = defineEmits<{
  'update:open': [boolean]
  'success': []
}>()

// Composables
const { deleteProducts, state, isLoading } = useProduct()

// État du modal (v-model)
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

/**
 * Produits sélectionnés
 */
const selectedProducts = computed(() => {
  return state.value.products.filter(p => props.ids.includes(p.id))
})

/**
 * Vérifie si des produits ont des variations
 */
const hasVariations = computed(() => {
  return selectedProducts.value.some(p => p.is_variable && (p.variations?.length ?? 0) > 0)
})

/**
 * Vérifie si des produits sont en précommande
 */
const hasPreorders = computed(() => {
  return selectedProducts.value.some(p => p.is_preorder_enabled)
})

/**
 * Vérifie si des produits sont supprimés (soft delete)
 */
const hasTrashed = computed(() => {
  return selectedProducts.value.some(p => !!p.deleted_at)
})

/**
 * Message d'avertissement si le produit a des variations ou précommandes
 */
const warningMessage = computed(() => {
  const warnings: string[] = []

  if (hasVariations.value) {
    warnings.push('certains produits contiennent des variations')
  }

  if (hasPreorders.value) {
    warnings.push('certains produits ont des précommandes actives')
  }

  if (warnings.length === 0) return null

  return `Attention : ${warnings.join(' et ')}. Ces éléments seront également supprimés.`
})

/**
 * Type d'action disponible
 */
const actionType = ref<'delete' | 'restore' | 'force'>('delete')

/**
 * Checkbox pour la suppression définitive (uniquement boolean)
 */
const isForceDelete = computed({
  get: () => actionType.value === 'force',
  set: (value: boolean) => {
    actionType.value = value ? 'force' : 'restore'
  }
})

/**
 * Texte du bouton selon l'action
 */
const buttonLabel = computed(() => {
  const count = props.ids.length

  switch (actionType.value) {
    case 'restore':
      return count > 1 ? `Restaurer ${count} produits` : 'Restaurer'
    case 'force':
      return count > 1 ? `Supprimer définitivement ${count} produits` : 'Supprimer définitivement'
    default:
      return count > 1 ? `Supprimer ${count} produits` : 'Supprimer'
  }
})

/**
 * Couleur du bouton selon l'action
 */
const buttonColor = computed(() => {
  return actionType.value === 'force' ? 'error' : 'warning'
})

/**
 * Description pour l'accessibilité
 */
const modalDescription = computed(() => {
  if (hasTrashed.value) {
    return props.ids.length > 1
      ? `Restaurer ${props.ids.length} produits depuis la corbeille`
      : 'Restaurer ce produit depuis la corbeille'
  }
  return props.ids.length > 1
    ? `Supprimer ${props.ids.length} produits du catalogue`
    : 'Supprimer ce produit du catalogue'
})

/**
 * Gère la suppression
 */
async function handleDelete(): Promise<void> {
  let success = false

  switch (actionType.value) {
    case 'restore':
      // TODO: A Implémenter
      success = false
      break
    case 'force':
      // TODO: A Implémenter
      success = false
      break
    default:
      success = await deleteProducts(props.ids)
      break
  }

  if (success) {
    isOpen.value = false
    emit('success')
  }
}

/**
 * Détermine le type d'action au montage
 */
watch(isOpen, (value) => {
  if (value) {
    actionType.value = hasTrashed.value ? 'restore' : 'delete'
  }
})
</script>

<template>
  <UModal
v-model:open="isOpen"
:title="hasTrashed ? 'Restaurer le produit' : 'Supprimer le produit'"
    :description="modalDescription">
    <template #content>
      <div class="p-6 space-y-4">
        <!-- Message principal -->
        <div v-if="hasTrashed" class="space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ ids.length > 1
              ? `Voulez-vous restaurer ces ${ids.length} produits ?`
              : 'Voulez-vous restaurer ce produit ?'
            }}
          </p>
          <p class="text-sm text-gray-500">
            Les produits seront à nouveau visibles et accessibles.
          </p>
        </div>

        <div v-else class="space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ ids.length > 1
              ? `Êtes-vous sûr de vouloir supprimer ces ${ids.length} produits ?`
              : 'Êtes-vous sûr de vouloir supprimer ce produit ?'
            }}
          </p>
          <p class="text-sm text-gray-500">
            {{ ids.length > 1
              ? 'Les produits seront placés dans la corbeille et pourront être restaurés ultérieurement.'
              : 'Le produit sera placé dans la corbeille et pourra être restauré ultérieurement.'
            }}
          </p>
        </div>

        <!-- Liste des produits sélectionnés -->
        <div
v-if="selectedProducts.length > 0 && selectedProducts.length <= 5"
          class="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-800">
          <div v-for="product in selectedProducts" :key="product.id" class="p-3 flex items-center justify-between">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <UAvatar
v-if="product.thumbnail_url || product.media?.[0]?.original_url"
                :src="product.thumbnail_url || product.media?.[0]?.original_url"
:alt="product.name"
size="sm"
                class="shrink-0" />
              <UAvatar
v-else
icon="i-lucide-package"
size="sm"
class="shrink-0 bg-gray-100 dark:bg-gray-800" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ product.name }}
                </p>
                <p class="text-xs text-gray-500 font-mono">
                  {{ product.sku }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UBadge
v-if="product.is_variable && product.variations && product.variations.length > 0"
variant="subtle"
                color="secondary"
size="xs">
                {{ product.variations.length }} variation{{ product.variations.length > 1 ? 's' : '' }}
              </UBadge>
              <UBadge
v-if="product.is_preorder_enabled"
variant="subtle"
color="secondary"
size="xs">
                Précommande
              </UBadge>
              <UBadge
v-if="product.stock_quantity <= 0"
variant="subtle"
color="error"
size="xs">
                Épuisé
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Message si plus de 5 produits -->
        <div v-else-if="selectedProducts.length > 5" class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedProducts.length }} produits sélectionnés
          </p>
        </div>

        <!-- Avertissement -->
        <UAlert
v-if="warningMessage && !hasTrashed"
color="warning"
variant="subtle"
icon="i-lucide-alert-triangle"
          :title="warningMessage" />

        <!-- Option de suppression définitive pour les produits supprimés -->
        <div v-if="hasTrashed" class="border-t pt-4">
          <div class="flex items-start gap-3">
            <UCheckbox v-model="isForceDelete" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Supprimer définitivement
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                Cette action est irréversible. Les produits seront supprimés de la base de données.
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton
label="Annuler"
color="neutral"
variant="ghost"
:disabled="isLoading"
@click="isOpen = false" />
          <UButton
:label="buttonLabel"
:color="buttonColor"
:loading="isLoading"
:icon="actionType === 'force' ? 'i-lucide-trash-2' : actionType === 'restore' ? 'i-lucide-refresh-cw' : 'i-lucide-trash'"
            @click="handleDelete" />
        </div>
      </div>
    </template>
  </UModal>
</template>
