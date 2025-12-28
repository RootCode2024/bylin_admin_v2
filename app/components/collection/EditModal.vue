<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Collection, CollectionFormData } from '~/types/collection'
import { validateImage, DEFAULT_IMAGE_OPTIONS } from '~/types/collection'


const props = defineProps<{
  open: boolean
  collection: Collection | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'updated': []
}>()


const { updateCollection, isLoading } = useCollections()
const toast = useToast()


const formRef = ref()
const existingCoverUrl = ref<string | null>(null)
const existingBannerUrl = ref<string | null>(null)
const removeCoverImage = ref(false)
const removeBannerImage = ref(false)
const coverPreviewUrl = ref<string | null>(null)
const bannerPreviewUrl = ref<string | null>(null)

const schema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .trim(),
  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  cover_image: z.instanceof(File).optional(),
  banner_image: z.instanceof(File).optional(),
  is_active: z.boolean().default(true),
  meta_title: z.string().max(255).optional().or(z.literal('')),
  meta_description: z.string().max(500).optional().or(z.literal(''))
})

type CollectionFormSchema = z.infer<typeof schema>

const state = reactive<Partial<CollectionFormSchema>>({
  name: '',
  description: '',
  cover_image: undefined,
  banner_image: undefined,
  is_active: true,
  meta_title: '',
  meta_description: ''
})

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const displayCoverUrl = computed(() => {
  return coverPreviewUrl.value || existingCoverUrl.value
})

const displayBannerUrl = computed(() => {
  return bannerPreviewUrl.value || existingBannerUrl.value
})

const hasCoverImage = computed(() => {
  return !!(state.cover_image || existingCoverUrl.value)
})

const hasBannerImage = computed(() => {
  return !!(state.banner_image || existingBannerUrl.value)
})

function cleanupCoverPreview(): void {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value)
    coverPreviewUrl.value = null
  }
}

function cleanupBannerPreview(): void {
  if (bannerPreviewUrl.value) {
    URL.revokeObjectURL(bannerPreviewUrl.value)
    bannerPreviewUrl.value = null
  }
}

function cleanupAllPreviews(): void {
  cleanupCoverPreview()
  cleanupBannerPreview()
}

function handleCoverImageChange(file: File | File[] | null | undefined): void {
  cleanupCoverPreview()

  if (!file) {
    state.cover_image = undefined
    return
  }

  const selectedFile = Array.isArray(file) ? file[0] : file

  if (selectedFile) {
    const validation = validateImage(selectedFile, DEFAULT_IMAGE_OPTIONS)

    if (!validation.valid) {
      toast.add({
        title: 'Image invalide',
        description: validation.error,
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      return
    }

    state.cover_image = selectedFile
    coverPreviewUrl.value = URL.createObjectURL(selectedFile)
    removeCoverImage.value = false
  }
}

function handleBannerImageChange(file: File | File[] | null | undefined): void {
  cleanupBannerPreview()

  if (!file) {
    state.banner_image = undefined
    return
  }

  const selectedFile = Array.isArray(file) ? file[0] : file

  if (selectedFile) {
    const validation = validateImage(selectedFile, DEFAULT_IMAGE_OPTIONS)

    if (!validation.valid) {
      toast.add({
        title: 'Image invalide',
        description: validation.error,
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      return
    }

    state.banner_image = selectedFile
    bannerPreviewUrl.value = URL.createObjectURL(selectedFile)
    removeBannerImage.value = false
  }
}

function removeCoverImageHandler(): void {
  cleanupCoverPreview()
  state.cover_image = undefined
  existingCoverUrl.value = null
  removeCoverImage.value = true
}

function removeBannerImageHandler(): void {
  cleanupBannerPreview()
  state.banner_image = undefined
  existingBannerUrl.value = null
  removeBannerImage.value = true
}


function resetFormWithCollection(collection: Collection): void {
  Object.assign(state, {
    name: collection.name,
    description: collection.description ?? '',
    is_active: collection.is_active,
    meta_title: collection.meta_title ?? '',
    meta_description: collection.meta_description ?? '',
    cover_image: undefined,
    banner_image: undefined
  })

  existingCoverUrl.value = collection.cover_image_url ?? null
  existingBannerUrl.value = collection.banner_image_url ?? null
  removeCoverImage.value = false
  removeBannerImage.value = false
  cleanupAllPreviews()
}

async function onSubmit(event: FormSubmitEvent<CollectionFormSchema>): Promise<void> {
  if (!props.collection) return

  try {
    const dataToSend: Partial<CollectionFormData> = {
      name: event.data.name,
      description: event.data.description || '',
      is_active: event.data.is_active,
      meta_title: event.data.meta_title || '',
      meta_description: event.data.meta_description || ''
    }

    if (state.cover_image instanceof File) {
      dataToSend.cover_image = state.cover_image
    } else if (removeCoverImage.value) {
      dataToSend.cover_image_to_delete = true
    }

    if (state.banner_image instanceof File) {
      dataToSend.banner_image = state.banner_image
    } else if (removeBannerImage.value) {
      dataToSend.banner_image_to_delete = true
    }

    const result = await updateCollection(props.collection.id, dataToSend)

    if (result) {
      toast.add({
        title: 'Succès',
        description: 'Collection mise à jour avec succès',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      isOpen.value = false
      emit('updated')
      cleanupAllPreviews()
    }
  } catch (error: unknown) {
    console.error('Erreur lors de la mise à jour:', error)

    let errorMessage = 'Impossible de mettre à jour la collection'

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message)
    }

    toast.add({
      title: 'Erreur',
      description: errorMessage,
      color: 'error',
      icon: 'i-lucide-alert-triangle'
    })
  }
}

function handleModalClose(): void {
  cleanupAllPreviews()
}

async function handleSubmit(): Promise<void> {
  if (formRef.value) {
    await formRef.value.submit()
  }
}

// ========================================
// Watchers
// ========================================
watch(isOpen, (value) => {
  if (value && props.collection) {
    resetFormWithCollection(props.collection)
  }
})

// ========================================
// Lifecycle
// ========================================
onBeforeUnmount(() => {
  cleanupAllPreviews()
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Modifier la collection"
    description="Mettre à jour les informations de la collection"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-7xl' }"
    @after:leave="handleModalClose"
  >
    <!-- Contenu du modal -->
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <!-- ========================================
             Informations de base
        ========================================= -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Informations générales
          </h3>

          <!-- Nom -->
          <UFormField label="Nom de la collection" name="name" required>
            <UInput
              v-model="state.name"
              placeholder="Ex: Collection Été 2024"
              size="lg"
              :disabled="isLoading"
              class="w-full"
            />
          </UFormField>

          <!-- Description -->
          <UFormField label="Description" name="description">
            <UTextarea
              v-model="state.description"
              placeholder="Décrivez votre collection..."
              :rows="4"
              :disabled="isLoading"
              class="w-full"
            />
          </UFormField>

          <!-- Statut -->
          <UFormField name="is_active">
            <USwitch
              v-model="state.is_active"
              :disabled="isLoading"
            >
              <template #label>
                <span class="text-sm font-medium">
                  Collection {{ state.is_active ? 'active' : 'inactive' }}
                </span>
              </template>
            </USwitch>
          </UFormField>
        </div>

        <USeparator />

        <!-- ========================================
             Images
        ========================================= -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Images de la collection
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Image de couverture -->
            <UFormField label="Image de couverture" name="cover_image">
              <UFileUpload
                v-slot="{ open: openFileDialog, removeFile }"
                :model-value="state.cover_image"
                :accept="DEFAULT_IMAGE_OPTIONS.acceptedTypes?.join(',') || 'image/*'"
                @update:model-value="handleCoverImageChange"
              >
                <div class="space-y-3">
                  <!-- Preview / Placeholder -->
                  <div
                    class="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                    :class="{ 'border-primary-500 dark:border-primary-400': hasCoverImage }"
                  >
                    <img
                      v-if="displayCoverUrl"
                      :src="displayCoverUrl"
                      alt="Cover preview"
                      class="w-full h-full object-cover"
                    >
                    <div
                      v-else
                      class="absolute inset-0 flex items-center justify-center"
                    >
                      <UIcon name="i-lucide-image" class="w-12 h-12 text-gray-400" />
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2">
                    <UButton
                      :label="hasCoverImage ? 'Modifier' : 'Télécharger'"
                      color="neutral"
                      variant="outline"
                      icon="i-lucide-upload"
                      size="sm"
                      :disabled="isLoading"
                      @click="openFileDialog()"
                    />

                    <UButton
                      v-if="hasCoverImage"
                      label="Supprimer"
                      color="error"
                      variant="outline"
                      icon="i-lucide-trash-2"
                      size="sm"
                      :disabled="isLoading"
                      @click="() => { removeFile(); removeCoverImageHandler() }"
                    />
                  </div>

                  <!-- Info fichier -->
                  <p v-if="state.cover_image" class="text-xs text-gray-600 dark:text-gray-400">
                    {{ state.cover_image.name }} ({{ (state.cover_image.size / 1024).toFixed(1) }} Ko)
                  </p>

                  <p class="text-xs text-gray-500 dark:text-gray-500">
                    Ratio recommandé: 1:1 (carré) • Max 2 MB
                  </p>
                </div>
              </UFileUpload>
            </UFormField>

            <!-- Image bannière -->
            <UFormField label="Bannière" name="banner_image">
              <UFileUpload
                v-slot="{ open: openFileDialog, removeFile }"
                :model-value="state.banner_image"
                :accept="DEFAULT_IMAGE_OPTIONS.acceptedTypes?.join(',') || 'image/*'"
                @update:model-value="handleBannerImageChange"
              >
                <div class="space-y-3">
                  <!-- Preview / Placeholder -->
                  <div
                    class="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                    :class="{ 'border-primary-500 dark:border-primary-400': hasBannerImage }"
                  >
                    <img
                      v-if="displayBannerUrl"
                      :src="displayBannerUrl"
                      alt="Banner preview"
                      class="w-full h-full object-cover"
                    >
                    <div
                      v-else
                      class="absolute inset-0 flex items-center justify-center"
                    >
                      <UIcon name="i-lucide-image" class="w-12 h-12 text-gray-400" />
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2">
                    <UButton
                      :label="hasBannerImage ? 'Modifier' : 'Télécharger'"
                      color="neutral"
                      variant="outline"
                      icon="i-lucide-upload"
                      size="sm"
                      :disabled="isLoading"
                      @click="openFileDialog()"
                    />

                    <UButton
                      v-if="hasBannerImage"
                      label="Supprimer"
                      color="error"
                      variant="outline"
                      icon="i-lucide-trash-2"
                      size="sm"
                      :disabled="isLoading"
                      @click="() => { removeFile(); removeBannerImageHandler() }"
                    />
                  </div>

                  <!-- Info fichier -->
                  <p v-if="state.banner_image" class="text-xs text-gray-600 dark:text-gray-400">
                    {{ state.banner_image.name }} ({{ (state.banner_image.size / 1024).toFixed(1) }} Ko)
                  </p>

                  <p class="text-xs text-gray-500 dark:text-gray-500">
                    Ratio recommandé: 16:9 • Max 2 MB
                  </p>
                </div>
              </UFileUpload>
            </UFormField>
          </div>
        </div>

        <USeparator />

        <!-- ========================================
             SEO (Optionnel)
        ========================================= -->
        <UAccordion
          :items="[
            {
              label: 'Paramètres SEO (optionnel)',
              icon: 'i-lucide-search',
              slot: 'seo'
            }
          ]"
        >
          <template #seo-body>
            <div class="space-y-4 pt-2">
              <!-- Titre SEO -->
              <UFormField label="Titre SEO" name="meta_title">
                <UInput
                  v-model="state.meta_title"
                  placeholder="Titre pour les moteurs de recherche"
                  :disabled="isLoading"
                  class="w-full"
                />
                <template #hint>
                  <span class="text-xs text-gray-500">
                    {{ state.meta_title?.length || 0 }}/255 caractères
                  </span>
                </template>
              </UFormField>

              <!-- Description SEO -->
              <UFormField label="Description SEO" name="meta_description">
                <UTextarea
                  v-model="state.meta_description"
                  placeholder="Description pour les moteurs de recherche"
                  :rows="3"
                  :disabled="isLoading"
                  class="w-full"
                />
                <template #hint>
                  <span class="text-xs text-gray-500">
                    {{ state.meta_description?.length || 0 }}/500 caractères
                  </span>
                </template>
              </UFormField>
            </div>
          </template>
        </UAccordion>
      </UForm>
    </template>

    <!-- Footer avec actions -->
    <template #footer="{ close }">
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Annuler"
          color="neutral"
          variant="ghost"
          :disabled="isLoading"
          @click="close"
        />

        <UButton
          label="Enregistrer les modifications"
          color="primary"
          icon="i-lucide-check"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.aspect-square,
.aspect-video {
  transition: border-color 0.2s ease;
}

.aspect-square:hover,
.aspect-video:hover {
  border-color: rgb(167, 139, 250);
}

@media (prefers-color-scheme: dark) {
  .aspect-square:hover,
  .aspect-video:hover {
    border-color: rgb(168, 85, 247);
  }
}
</style>
