<script setup lang="ts">
const props = defineProps<{
  open: boolean
  ids: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

const { forceDeleteBrands, loading } = useBrands()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Messages
const title = computed(() => {
  return props.ids.length === 1
    ? 'Supprimer définitivement cette marque ?'
    : `Supprimer définitivement ${props.ids.length} marques ?`
})

const description = computed(() => {
  return 'Cette action est irréversible. Les marques seront supprimées définitivement de la base de données.'
})

async function handleConfirm() {
  const success = await forceDeleteBrands(props.ids)

  if (success) {
    isOpen.value = false
    emit('success')
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="title" :description="description">
    <template #content>
      <div class="p-4 space-y-4">
        <!-- Avertissement danger -->
        <UAlert
color="error"
variant="subtle"
title="⚠️ Action irréversible"
          description="Les marques seront supprimées définitivement et ne pourront pas être restaurées. Cette action ne peut pas être annulée."
          icon="i-lucide-alert-triangle" />

        <!-- Nombre de marques -->
        <div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-center border border-red-200 dark:border-red-800">
          <span class="text-sm font-medium text-red-600 dark:text-red-400">
            {{ ids.length }} marque(s) {{ ids.length === 1 ? 'sera supprimée' : 'seront supprimées' }} définitivement
          </span>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton
label="Annuler"
color="neutral"
variant="ghost"
:disabled="loading"
@click="isOpen = false" />
          <UButton
label="Supprimer définitivement"
color="error"
icon="i-lucide-trash-2"
:loading="loading"
            @click="handleConfirm" />
        </div>
      </div>
    </template>
  </UModal>
</template>
