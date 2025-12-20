<script setup lang="ts">
/**
 * Composant de suppression de catégorie(s)
 *
 * Modal de confirmation pour supprimer une ou plusieurs catégories
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
const { deleteCategories, restoreCategories, forceDeleteCategories, loading, categories } = useCategories()

// État du modal (v-model)
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

/**
 * Catégories sélectionnées
 */
const selectedCategories = computed(() => {
  return categories.value.filter(c => props.ids.includes(c.id))
})

/**
 * Vérifie si des catégories ont des enfants
 */
const hasChildren = computed(() => {
  return selectedCategories.value.some(c => (c.children_count ?? 0) > 0)
})

/**
 * Vérifie si des catégories ont des produits
 */
const hasProducts = computed(() => {
  return selectedCategories.value.some(c => c.products_count > 0)
})

/**
 * Vérifie si des catégories sont supprimées (soft delete)
 */
const hasTrashed = computed(() => {
  return selectedCategories.value.some(c => !!c.deleted_at)
})

/**
 * Message d'avertissement si la catégorie a des enfants ou produits
 */
const warningMessage = computed(() => {
  const warnings: string[] = []

  if (hasChildren.value) {
    warnings.push('certaines catégories contiennent des sous-catégories')
  }

  if (hasProducts.value) {
    warnings.push('certaines catégories contiennent des produits')
  }

  if (warnings.length === 0) return null

  return `Attention : ${warnings.join(' et ')}. La suppression sera impossible tant que ces éléments n'auront pas été déplacés ou supprimés.`
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
  const suffix = count > 1 ? 's' : ''

  switch (actionType.value) {
    case 'restore':
      return count > 1 ? `Restaurer ${count} catégories` : 'Restaurer'
    case 'force':
      return count > 1 ? `Supprimer définitivement ${count} catégories` : 'Supprimer définitivement'
    default:
      return count > 1 ? `Supprimer ${count} catégories` : 'Supprimer'
  }
})

/**
 * Couleur du bouton selon l'action
 */
const buttonColor = computed(() => {
  return actionType.value === 'force' ? 'error' : 'primary'
})

/**
 * Gère la suppression
 */
async function handleDelete(): Promise<void> {
  let success = false

  switch (actionType.value) {
    case 'restore':
      success = await restoreCategories(props.ids)
      break
    case 'force':
      success = await forceDeleteCategories(props.ids)
      break
    default:
      success = await deleteCategories(props.ids)
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
  <UModal v-model:open="isOpen" :title="hasTrashed ? 'Restaurer la catégorie' : 'Supprimer la catégorie'"
    :ui="{ body: 'min-w-md' }">
    <template #content>
      <div class="p-6 space-y-4">
        <!-- Message principal -->
        <div v-if="hasTrashed" class="space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ ids.length > 1
              ? `Voulez-vous restaurer ces ${ids.length} catégories ?`
              : 'Voulez-vous restaurer cette catégorie ?'
            }}
          </p>
          <p class="text-sm text-gray-500">
            Les catégories seront à nouveau visibles et accessibles.
          </p>
        </div>

        <div v-else class="space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ ids.length > 1
              ? `Êtes-vous sûr de vouloir supprimer ces ${ids.length} catégories ?`
              : 'Êtes-vous sûr de vouloir supprimer cette catégorie ?'
            }}
          </p>
          <p class="text-sm text-gray-500">
            {{ ids.length > 1
              ? 'Les catégories seront placées dans la corbeille et pourront être restaurées ultérieurement.'
              : 'La catégorie sera placée dans la corbeille et pourra être restaurée ultérieurement.'
            }}
          </p>
        </div>

        <!-- Liste des catégories sélectionnées -->
        <div v-if="selectedCategories.length > 0 && selectedCategories.length <= 5"
          class="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-800">
          <div v-for="category in selectedCategories" :key="category.id" class="p-3 flex items-center justify-between">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <UIcon :name="`i-lucide-${category.icon || 'folder'}`" class="w-4 h-4 text-gray-400 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ category.name }}
                </p>
                <p v-if="category.path" class="text-xs text-gray-500 truncate">
                  {{ category.path }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UBadge v-if="category.children_count && category.children_count > 0" variant="subtle" color="secondary"
                size="xs">
                {{ category.children_count }} enfant{{ category.children_count > 1 ? 's' : '' }}
              </UBadge>
              <UBadge v-if="category.products_count > 0" variant="subtle" color="primary" size="xs">
                {{ category.products_count }} produit{{ category.products_count > 1 ? 's' : '' }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Message si plus de 5 catégories -->
        <div v-else-if="selectedCategories.length > 5"
          class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedCategories.length }} catégories sélectionnées
          </p>
        </div>

        <!-- Avertissement -->
        <UAlert v-if="warningMessage && !hasTrashed" color="warning" variant="subtle" icon="i-lucide-alert-triangle"
          :title="warningMessage" />

        <!-- Option de suppression définitive pour les catégories supprimées -->
        <div v-if="hasTrashed" class="border-t pt-4">
          <div class="flex items-start gap-3">
            <UCheckbox v-model="isForceDelete" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Supprimer définitivement
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                Cette action est irréversible. Les catégories seront supprimées de la base de données.
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="isOpen = false" :disabled="loading" />
          <UButton :label="buttonLabel" :color="buttonColor" @click="handleDelete" :loading="loading"
            :icon="actionType === 'force' ? 'i-lucide-trash-2' : actionType === 'restore' ? 'i-lucide-refresh-cw' : 'i-lucide-trash'" />
        </div>
      </div>
    </template>
  </UModal>
</template>