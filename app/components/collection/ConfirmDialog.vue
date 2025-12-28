<script setup lang="ts">
/**
 * Composant réutilisable de dialogue de confirmation
 *
 * Affiche un modal stylé pour confirmer une action
 * Supporte différents variants (danger, warning, info)
 */

interface Props {
  open: boolean
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirmer l\'action',
  confirmLabel: 'Confirmer',
  cancelLabel: 'Annuler',
  variant: 'danger',
  loading: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'cancel': []
}>()

// Configuration des variants
const variantConfig = {
  danger: {
    icon: 'i-lucide-alert-triangle',
    color: 'error' as const,
    bgClass: 'bg-error-100 dark:bg-error-900/20',
    iconClass: 'text-error-600 dark:text-error-400'
  },
  warning: {
    icon: 'i-lucide-alert-circle',
    color: 'warning' as const,
    bgClass: 'bg-warning-100 dark:bg-warning-900/20',
    iconClass: 'text-warning-600 dark:text-warning-400'
  },
  info: {
    icon: 'i-lucide-info',
    color: 'primary' as const,
    bgClass: 'bg-primary-100 dark:bg-primary-900/20',
    iconClass: 'text-primary-600 dark:text-primary-400'
  }
} as const

const config = computed(() => variantConfig[props.variant])

// État du modal (v-model)
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="title" :ui="{ body: 'min-w-md' }">
    <template #content>
      <div class="p-6 space-y-4">
        <!-- Icône + Description -->
        <div class="flex gap-3">
          <div :class="['p-2 rounded-full shrink-0 h-fit', config.bgClass]">
            <UIcon :name="config.icon" :class="['w-5 h-5', config.iconClass]" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {{ description }}
            </p>
          </div>
        </div>

        <!-- Slot pour contenu additionnel -->
        <slot />

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton
:label="cancelLabel"
color="neutral"
variant="ghost"
:disabled="loading"
@click="handleCancel" />
          <UButton
:label="confirmLabel"
:color="config.color"
:loading="loading"
@click="handleConfirm" />
        </div>
      </div>
    </template>
  </UModal>
</template>
