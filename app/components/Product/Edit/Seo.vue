<script setup lang="ts">
import { useProductFormStore } from '~/stores/productForm'

const productFormStore = useProductFormStore()
</script>

<template>
  <div class="space-y-6 p-6">
    <UFormField label="Titre SEO">
      <UInput :model-value="productFormStore.formData.meta_title"
        @update:model-value="productFormStore.setFormData({ meta_title: $event })"
        placeholder="Titre pour les moteurs de recherche" class="w-full" />
      <template #hint>
        <span class="text-xs">{{ productFormStore.formData.meta_title?.length || 0 }}/60 caractères recommandés</span>
      </template>
    </UFormField>

    <UFormField label="Description SEO">
      <UTextarea :model-value="productFormStore.formData.meta_description"
        @update:model-value="productFormStore.setFormData({ meta_description: $event })" :rows="6"
        placeholder="Description pour les moteurs de recherche" class="w-full" />
      <template #hint>
        <span class="text-xs">{{ productFormStore.formData.meta_description?.length || 0 }}/160 caractères
          recommandés</span>
      </template>
    </UFormField>

    <!-- Aperçu Google -->
    <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
      <p class="text-xs text-gray-500 mb-2">Aperçu Google</p>
      <div class="space-y-1">
        <h4 class="text-blue-600 text-lg">{{ productFormStore.formData.meta_title || productFormStore.formData.name }}
        </h4>
        <p class="text-xs text-green-700">{{ `https://votresite.com/products/${productFormStore.formData.slug}` }}</p>
        <p class="text-sm text-gray-600">
          {{ productFormStore.formData.meta_description || productFormStore.formData.short_description || 'Aucune description' }}
        </p>
      </div>
    </div>
  </div>
</template>
