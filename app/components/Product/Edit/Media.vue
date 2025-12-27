<script setup lang="ts">
interface ImageData {
  id?: number
  url: string
  file?: File
  isNew: boolean
}

const productFormStore = useProductFormStore()
const toast = useToast()

function handleImageUpload(files: File[]) {
  const newImages = [...productFormStore.images]

  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        title: 'Fichier trop volumineux',
        description: `${file.name} dépasse 5MB`,
        color: 'error'
      })
      return
    }

    const url = URL.createObjectURL(file)
    newImages.push({ url, file, isNew: true })
  })

  productFormStore.images = newImages
}

function removeImage(index: number) {
  const img = productFormStore.images[index]
  const newImages = [...productFormStore.images]
  const newImagesToDelete = [...productFormStore.imagesToDelete]

  if (img && !img.isNew && img.id) {
    newImagesToDelete.push(img.id)
    productFormStore.imagesToDelete = newImagesToDelete
  }

  newImages.splice(index, 1)
  productFormStore.images = newImages
}

function reorderImages(oldIndex: number, newIndex: number) {
  const newImages = [...productFormStore.images]
  const item = newImages[oldIndex]
  if (!item) return

  newImages.splice(oldIndex, 1)
  newImages.splice(newIndex, 0, item)
  productFormStore.images = newImages
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Upload zone -->
    <div>
      <label class="block text-sm font-medium mb-2">Ajouter des images</label>
      <input type="file" multiple accept="image/png,image/jpeg,image/webp" @change="(e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) handleImageUpload(Array.from(files))
      }"
        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
      <p class="mt-1 text-xs text-gray-500">PNG, JPG, WEBP jusqu'à 5MB par fichier</p>
    </div>

    <!-- Galerie d'images -->
    <div v-if="productFormStore.images.length > 0">
      <div class="flex items-center justify-between mb-3">
        <label class="block text-sm font-medium">Images du produit ({{ productFormStore.images.length }})</label>
        <p class="text-xs text-gray-500">La première image sera l'image principale</p>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div v-for="(image, idx) in productFormStore.images" :key="idx"
          class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group">
          <img :src="image.url" :alt="`Image ${idx + 1}`" class="w-full h-full object-cover" />

          <!-- Badge "Principal" -->
          <div v-if="idx === 0" class="absolute top-2 left-2">
            <UBadge color="primary" variant="solid" size="xs">Principal</UBadge>
          </div>

          <!-- Badge "Nouveau" -->
          <div v-if="image.isNew" class="absolute top-2 right-2">
            <UBadge color="success" variant="solid" size="xs">Nouveau</UBadge>
          </div>

          <!-- Actions overlay -->
          <div
            class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <UButton v-if="idx > 0" icon="i-lucide-arrow-left" color="neutral" variant="solid" size="xs"
              @click="reorderImages(idx, idx - 1)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="solid" size="xs" @click="removeImage(idx)" />
            <UButton v-if="idx < productFormStore.images.length - 1" icon="i-lucide-arrow-right" color="neutral"
              variant="solid" size="xs" @click="reorderImages(idx, idx + 1)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucune image -->
    <UAlert v-else icon="i-lucide-image" color="neutral" variant="soft" title="Aucune image"
      description="Ajoutez des images pour mettre en valeur votre produit" />
  </div>
</template>
