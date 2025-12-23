<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Collection } from '~/types/collection'
import { DEFAULT_IMAGE_CONFIG } from '~/utils/helpers'

const props = defineProps<{
  open: boolean
  collection: Collection | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'updated': []
}>()

const { updateCollection, isLoading } = useCollections()

// ========================================
// État
// ========================================
const existingImageUrl = ref<string | null>(null)
const removeExistingImage = ref(false)
const objectUrls = new Set<string>()

/**
 * Schéma de validation Zod
 */
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
  image: z.instanceof(File).optional(),
  is_active: z.boolean().default(true),
  meta_title: z.string().max(255).optional().or(z.literal('')),
  meta_description: z.string().max(500).optional().or(z.literal(''))
})

type CollectionFormSchema = z.infer<typeof schema>

const state = reactive<Partial<CollectionFormSchema>>({
  name: '',
  description: '',
  image: undefined,
  is_active: true,
  meta_title: '',
  meta_description: ''
})

// ========================================
// Computed
// ========================================
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// ========================================
// Methods
// ========================================

function createPreviewUrl(file: File): string {
  const url = URL.createObjectURL(file)
  objectUrls.add(url)
  return url
}

function cleanupObjectUrls(): void {
  objectUrls.forEach(url => URL.revokeObjectURL(url))
  objectUrls.clear()
}

function removeImage(): void {
  state.image = undefined
  existingImageUrl.value = null
  removeExistingImage.value = true
}

function resetFormWithCollection(collection: Collection): void {
  Object.assign(state, {
    name: collection.name,
    description: collection.description ?? '',
    is_active: collection.is_active,
    meta_title: collection.meta_title ?? '',
    meta_description: collection.meta_description ?? '',
    image: undefined
  })
  existingImageUrl.value = collection.image_url ?? null
  removeExistingImage.value = false
  cleanupObjectUrls()
}

async function onSubmit(event: FormSubmitEvent<CollectionFormSchema>): Promise<void> {
  if (!props.collection) return

  try {
    const formData = new FormData()
    formData.append('name', event.data.name)
    formData.append('is_active', event.data.is_active ? '1' : '0')

    if (event.data.description) {
      formData.append('description', event.data.description)
    }
    if (event.data.image) {
      formData.append('image', event.data.image)
    }
    if (removeExistingImage.value) {
      formData.append('remove_image', '1')
    }
    if (event.data.meta_title) {
      formData.append('meta_title', event.data.meta_title)
    }
    if (event.data.meta_description) {
      formData.append('meta_description', event.data.meta_description)
    }

    // ✅ CORRECTION: Passer un objet au lieu de FormData directement
    const dataToSend = {
      name: event.data.name,
      description: event.data.description,
      is_active: event.data.is_active,
      meta_title: event.data.meta_title,
      meta_description: event.data.meta_description,
      image: event.data.image,
      image_to_delete: removeExistingImage.value
    }

    const success = await updateCollection(props.collection.id, dataToSend)

    if (success) {
      isOpen.value = false
      emit('updated')
      cleanupObjectUrls()
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
  }
}

function handleModalClose(): void {
  cleanupObjectUrls()
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
onBeforeUnmount(() => cleanupObjectUrls())
</script>

<template>
  <UModal v-model:open="isOpen" title="Modifier la collection"
    description="Mettre à jour les informations de la collection" :ui="{ content: 'min-w-[60%]' }"
    @close="handleModalClose">
    <template #body>
      <UForm :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <!-- Nom -->
        <UFormField label="Nom de la collection" name="name" required>
          <UInput v-model="state.name" placeholder="Ex: Collection Été 2024" class="w-full" :disabled="isLoading" />
        </UFormField>

        <!-- Description -->
        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" :rows="4" class="w-full" :disabled="isLoading" />
        </UFormField>

        <!-- Image -->
        <UFormField label="Image de la collection" name="image">
          <UFileUpload v-slot="{ open: openFileDialog, removeFile }" v-model="state.image"
            :accept="DEFAULT_IMAGE_CONFIG.acceptedTypes.join(',')">
            <div class="flex items-center gap-3">
              <UAvatar size="lg" :src="state.image ? createPreviewUrl(state.image) : existingImageUrl ?? undefined"
                icon="i-lucide-image" />
              <UButton :label="state.image || existingImageUrl ? 'Modifier l\'image' : 'Télécharger'" color="neutral"
                variant="outline" icon="i-lucide-upload" @click="openFileDialog()" :disabled="isLoading" />
            </div>
            <div v-if="state.image || existingImageUrl" class="mt-2">
              <p v-if="state.image" class="text-xs">{{ state.image.name }}</p>
              <UButton label="Supprimer l'image" color="error" variant="link" size="xs" class="p-0"
                @click="() => { removeFile(); removeImage() }" />
            </div>
          </UFileUpload>
        </UFormField>

        <!-- Options -->
        <div class="border-t pt-4">
          <USwitch v-model="state.is_active" label="Collection active" />
        </div>

        <!-- SEO -->
        <UAccordion :items="[{ label: 'Paramètres SEO (optionnel)', icon: 'i-lucide-search', defaultOpen: false }]">
          <template #default>
            <div class="space-y-4 pt-4">
              <UFormField label="Titre SEO" name="meta_title">
                <UInput v-model="state.meta_title" class="w-full" />
                <template #hint>
                  <span class="text-xs">{{ state.meta_title?.length || 0 }}/255 caractères</span>
                </template>
              </UFormField>

              <UFormField label="Description SEO" name="meta_description">
                <UTextarea v-model="state.meta_description" :rows="3" class="w-full" />
                <template #hint>
                  <span class="text-xs">{{ state.meta_description?.length || 0 }}/500 caractères</span>
                </template>
              </UFormField>
            </div>
          </template>
        </UAccordion>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="isOpen = false" />
          <UButton label="Enregistrer" color="primary" type="submit" :loading="isLoading" icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
