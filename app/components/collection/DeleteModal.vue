<script setup lang="ts">
/**
 * Composant de suppression de collection(s)
 *
 * Modal de confirmation pour supprimer une ou plusieurs collections
 * Gère la suppression soft delete, restauration et suppression définitive
 */

// Props du composant
const props = defineProps<{
  open: boolean
  collectionIds: string[]
}>()

// Événements émis par le composant
const emit = defineEmits<{
  'update:open': [boolean]
  'deleted': []
}>()

// Composables
const { deleteCollections, state } = useCollections()

// État du modal (v-model)
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const isDeleting = ref(false)

/**
 * Collections sélectionnées
 */
const selectedCollections = computed(() => {
  return state.value.collections.filter(c => props.collectionIds.includes(c.id))
})

/**
 * Vérifie si des collections ont des produits
 */
const hasProducts = computed(() => {
  return selectedCollections.value.some(c => c.products_count > 0)
})

/**
 * Message d'avertissement si la collection a des produits
 */
const warningMessage = computed(() => {
  if (!hasProducts.value) return null

  const totalProducts = selectedCollections.value.reduce((sum, c) => sum + (c.products_count || 0), 0)

  return `Attention : ${totalProducts} produit${totalProducts > 1 ? 's' : ''} ${totalProducts > 1 ? 'sont associés' : 'est associé'} à ${props.collectionIds.length > 1 ? 'ces collections' : 'cette collection'}. ${totalProducts > 1 ? 'Ils' : 'Il'} ne seront pas supprimés mais ne seront plus dans aucune collection.`
})

/**
 * Texte du bouton
 */
const buttonLabel = computed(() => {
  const count = props.collectionIds.length
  return count > 1 ? `Supprimer ${count} collections` : 'Supprimer'
})

/**
 * Gère la suppression
 */
async function handleDelete(): Promise<void> {
  isDeleting.value = true

  try {
    const success = await deleteCollections(props.collectionIds)

    if (success) {
      isOpen.value = false
      emit('deleted')
    }
  } finally {
    isDeleting.value = false
  }
}

/**
 * Annule la suppression
 */
function handleCancel() {
  isOpen.value = false
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Supprimer la collection" :ui="{ body: 'min-w-md' }">
    <template #content>
      <div class="p-6 space-y-4">
        <!-- Message principal -->
        <div class="space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ collectionIds.length > 1
              ? `Êtes-vous sûr de vouloir supprimer ces ${collectionIds.length} collections ?`
              : 'Êtes-vous sûr de vouloir supprimer cette collection ?'
            }}
          </p>
          <p class="text-sm text-gray-500">
            {{ collectionIds.length > 1
              ? 'Les collections seront supprimées définitivement.'
              : 'La collection sera supprimée définitivement.'
            }}
          </p>
        </div>

        <!-- Liste des collections sélectionnées -->
        <div v-if="selectedCollections.length > 0 && selectedCollections.length <= 5"
          class="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-800">
          <div v-for="collection in selectedCollections" :key="collection.id"
            class="p-3 flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="shrink-0">
                <UAvatar v-if="collection.image_url" :src="collection.image_url" :alt="collection.name" size="sm"
                  class="rounded-md" />
                <UAvatar v-else icon="i-lucide-folder" size="sm" class="rounded-md bg-gray-100 dark:bg-gray-800" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ collection.name }}
                </p>
                <p v-if="collection.description" class="text-xs text-gray-500 truncate">
                  {{ collection.description }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-3">
              <UBadge v-if="collection.products_count > 0" variant="subtle" color="primary" size="xs">
                {{ collection.products_count }} produit{{ collection.products_count > 1 ? 's' : '' }}
              </UBadge>
              <UBadge v-if="!collection.is_active" variant="subtle" color="neutral" size="xs">
                Inactive
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Message si plus de 5 collections -->
        <div v-else-if="selectedCollections.length > 5"
          class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedCollections.length }} collections sélectionnées
          </p>
        </div>

        <!-- Avertissement produits -->
        <UAlert v-if="warningMessage" color="warning" variant="subtle" icon="i-lucide-alert-triangle">
          <template #title>
            <span class="text-sm">{{ warningMessage }}</span>
          </template>
        </UAlert>

        <!-- Informations supplémentaires -->
        <UAlert color="error" variant="subtle" icon="i-lucide-info">
          <template #title>
            <span class="text-sm font-medium">Cette action est irréversible</span>
          </template>
          <template #description>
            <ul class="list-disc list-inside space-y-1 text-xs mt-2">
              <li>Les collections seront supprimées définitivement</li>
              <li>Les produits associés ne seront pas supprimés</li>
              <li>Cette action ne peut pas être annulée</li>
            </ul>
          </template>
        </UAlert>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="handleCancel" :disabled="isDeleting" />
          <UButton :label="buttonLabel" color="error" icon="i-lucide-trash-2" @click="handleDelete"
            :loading="isDeleting" />
        </div>
      </div>
    </template>
  </UModal>
</template>
