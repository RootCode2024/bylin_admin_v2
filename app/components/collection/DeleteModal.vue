<script setup lang="ts">
const props = defineProps<{
  open: boolean
  collectionIds: string[]
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  'deleted': []
}>()

const { deleteCollections, state } = useCollections()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const isDeleting = ref(false)

const selectedCollections = computed(() => {
  return state.value.collections.filter(c => props.collectionIds.includes(c.id))
})

const hasProducts = computed(() => {
  return selectedCollections.value.some(c => c.products_count > 0)
})

const warningMessage = computed(() => {
  if (!hasProducts.value) return null

  const totalProducts = selectedCollections.value.reduce((sum, c) => sum + (c.products_count || 0), 0)

  return `Attention : ${totalProducts} produit${totalProducts > 1 ? 's' : ''} ${totalProducts > 1 ? 'sont associés' : 'est associé'} à ${props.collectionIds.length > 1 ? 'ces collections' : 'cette collection'}. ${totalProducts > 1 ? 'Ils' : 'Il'} ne seront pas supprimés mais ne seront plus dans aucune collection.`
})

const buttonLabel = computed(() => {
  const count = props.collectionIds.length
  return count > 1 ? `Supprimer ${count} collections` : 'Supprimer'
})

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
        <div
v-if="selectedCollections.length > 0 && selectedCollections.length <= 5"
          class="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-800">
          <div
v-for="collection in selectedCollections"
:key="collection.id"
            class="p-3 flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1 min-w-0">
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
              <UBadge
v-if="collection.products_count > 0"
variant="subtle"
color="primary"
size="xs">
                {{ collection.products_count }} produit{{ collection.products_count > 1 ? 's' : '' }}
              </UBadge>
              <UBadge
v-if="!collection.is_active"
variant="subtle"
color="neutral"
size="xs">
                Inactive
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Message si plus de 5 collections -->
        <div
v-else-if="selectedCollections.length > 5"
          class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedCollections.length }} collections sélectionnées
          </p>
        </div>

        <!-- Avertissement produits -->
        <UAlert
v-if="warningMessage"
color="warning"
variant="subtle"
icon="i-lucide-alert-triangle">
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
          <UButton
label="Annuler"
color="neutral"
variant="ghost"
:disabled="isDeleting"
@click="handleCancel" />
          <UButton
:label="buttonLabel"
color="error"
icon="i-lucide-trash-2"
:loading="isDeleting"
            @click="handleDelete" />
        </div>
      </div>
    </template>
  </UModal>
</template>
