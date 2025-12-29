<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ImageUploadOptions } from '~/types/collection'
import { validateImage, createImagePreview, revokeImagePreview, DEFAULT_IMAGE_OPTIONS } from '~/types/collection'

interface Props {
  modelValue?: File | string | null
  label?: string
  description?: string
  currentImageUrl?: string | null
  options?: ImageUploadOptions
  disabled?: boolean
  required?: boolean
  aspectRatio?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: 'Image',
  description: '',
  currentImageUrl: null,
  options: () => DEFAULT_IMAGE_OPTIONS,
  disabled: false,
  required: false,
  aspectRatio: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | null): void
  (e: 'delete'): void
  (e: 'error', error: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const isDragging = ref(false)
const error = ref<string | null>(null)

// Computed
const hasCurrentImage = computed(() => {
  return !!props.currentImageUrl || !!previewUrl.value
})

const displayUrl = computed(() => {
  return previewUrl.value || props.currentImageUrl
})

const acceptedTypesString = computed(() => {
  return props.options?.acceptedTypes?.join(',') || 'image/*'
})

const maxSizeLabel = computed(() => {
  const maxSize = props.options?.maxSize || DEFAULT_IMAGE_OPTIONS.maxSize!
  return `${(maxSize / (1024 * 1024)).toFixed(0)} MB`
})

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue instanceof File) {
    updatePreview(newValue)
  } else if (!newValue) {
    clearPreview()
  }
})

// Methods
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    processFile(file)
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]

  if (file) {
    processFile(file)
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function processFile(file: File) {
  error.value = null

  const validation = validateImage(file, props.options)

  if (!validation.valid) {
    error.value = validation.error || 'Fichier invalide'
    emit('error', error.value)
    return
  }

  updatePreview(file)

  emit('update:modelValue', file)
}

function updatePreview(file: File) {
  if (previewUrl.value) revokeImagePreview(previewUrl.value)
  previewUrl.value = createImagePreview(file)
}

function clearPreview() {
  if (previewUrl.value) {
    revokeImagePreview(previewUrl.value)
    previewUrl.value = null
  }
}

function openFileDialog() {
  if (!props.disabled) fileInput.value?.click()
}

function handleDelete() {
  clearPreview()
  emit('update:modelValue', null)
  emit('delete')

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

onBeforeUnmount(() => {
  clearPreview()
})
</script>

<template>
  <div class="image-upload">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Description -->
    <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mb-3">
      {{ description }}
    </p>

    <!-- Upload Area -->
    <div
      v-if="!hasCurrentImage"
      class="upload-area"
      :class="{
        'upload-area--dragging': isDragging,
        'upload-area--disabled': disabled,
        'upload-area--error': error,
      }"
      @click="openFileDialog"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="acceptedTypesString"
        :disabled="disabled"
        class="hidden"
        @change="handleFileSelect"
      >

      <div class="upload-area__content">
        <UIcon name="i-lucide-upload-cloud" class="w-12 h-12 text-gray-400 mb-3" />

        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cliquez pour télécharger ou glissez-déposez
        </p>

        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ acceptedTypesString.replace(/image\//g, '').toUpperCase() }} jusqu'à {{ maxSizeLabel }}
        </p>

        <p v-if="aspectRatio" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Ratio recommandé: {{ aspectRatio }}
        </p>
      </div>
    </div>

    <!-- Image Preview -->
    <div v-else class="image-preview">
      <div class="image-preview__container" :style="aspectRatio ? { aspectRatio } : {}">
        <img
          :src="displayUrl!"
          :alt="label"
          class="image-preview__img"
        >

        <div class="image-preview__overlay">
          <div class="image-preview__actions">
            <UButton
              icon="i-lucide-pencil"
              size="sm"
              color="neutral"
              variant="solid"
              :disabled="disabled"
              @click="openFileDialog"
            >
              Modifier
            </UButton>

            <UButton
              icon="i-lucide-trash-2"
              size="sm"
              color="error"
              variant="solid"
              :disabled="disabled"
              @click="handleDelete"
            >
              Supprimer
            </UButton>
          </div>
        </div>
      </div>

      <!-- Hidden file input for replacing image -->
      <input
        ref="fileInput"
        type="file"
        :accept="acceptedTypesString"
        :disabled="disabled"
        class="hidden"
        @change="handleFileSelect"
      >
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.image-upload {
  @apply w-full;
}

.upload-area {
  @apply relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer transition-colors;
}

.upload-area:hover:not(.upload-area--disabled) {
  @apply border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/10;
}

.upload-area--dragging {
  @apply border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/10;
}

.upload-area--disabled {
  @apply cursor-not-allowed opacity-50;
}

.upload-area--error {
  @apply border-red-500 dark:border-red-400;
}

.upload-area__content {
  @apply flex flex-col items-center;
}

.image-preview {
  @apply relative w-full;
}

.image-preview__container {
  @apply relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800;
}

.image-preview__img {
  @apply w-full h-full object-cover;
}

.image-preview__overlay {
  @apply absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center;
}

.image-preview__actions {
  @apply flex gap-2;
}
</style>
