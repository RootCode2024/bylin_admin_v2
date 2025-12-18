<script setup lang="ts">
// Nuxt UI 4.2+ standard
const props = defineProps<{
  open: boolean // v-model:open
  ids: string[]
}>()

const emit = defineEmits(['update:open', 'success'])

const { deleteCustomers, loading } = useCustomers()
const toast = useToast()

// Fonction de fermeture propre
function close() {
  emit('update:open', false)
}

async function onConfirm() {
  const success = await deleteCustomers(props.ids)

  if (success) {
    toast.add({
      title: 'Suppression réussie',
      description: `${props.ids.length} client(s) supprimé(s) avec succès.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    emit('success')
    close()
  }
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6">
        <div class="flex items-center gap-4 mb-5">
          <div
            class="p-3 rounded-full bg-error-50 dark:bg-error-950/50 text-error-600 dark:text-error-400 ring-1 ring-error-200 dark:ring-error-900">
            <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Supprimer {{ ids.length > 1 ? 'les clients' : 'le client' }} ?
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cette action est irréversible. Les données seront définitivement effacées de la base.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="close" :disabled="loading" />
          <UButton label="Confirmer la suppression" color="error" variant="solid" :loading="loading"
            @click="onConfirm" />
        </div>
      </div>
    </template>
  </UModal>
</template>
