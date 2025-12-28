<script setup lang="ts">
import type { Category } from '~/types/category'
import type { Brand } from '~/types/brand'
import { useProductFormStore } from '~/stores/productForm'

const props = defineProps<{
  brands: Brand[]
  categories: readonly Category[]
}>()

const productFormStore = useProductFormStore()

// interface pour les options de catégorie
interface CategoryOption {
  label: string
  value: number | string
  level?: number
}

const selectedBrand = computed(() => {
  if (!productFormStore.formData.brand_id) return null
  return props.brands.find(b => b.id === productFormStore.formData.brand_id)
})

const brandOptions = computed(() => {
  return props.brands.map(brand => ({
    label: brand.name,
    value: brand.id,
    logo_url: brand.logo_url
  }))
})

const categoryOptions = computed(() => {
  const flatten = (cats: readonly Category[], prefix = '', result: CategoryOption[] = []): CategoryOption[] => {
    cats.forEach(cat => {
      result.push({
        label: prefix + cat.name,
        value: cat.id,
        level: cat.level
      })
      if (cat.children?.length) flatten(cat.children, prefix + '  ', result)
    })
    return result
  }
  return flatten(props.categories)
})

function generateSlug() {
  if (!productFormStore.formData.name) return

  const slug = productFormStore.formData.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  productFormStore.setFormData({ slug })
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Marque" required>
        <USelectMenu
:model-value="productFormStore.formData.brand_id"
:items="brandOptions"
value-key="value"
          label-key="label"
placeholder="Sélectionner une marque"
searchable
class="w-full"
          @update:model-value="productFormStore.setFormData({ brand_id: $event })">
          <template v-if="selectedBrand" #leading>
            <img v-if="selectedBrand.logo_url" :src="selectedBrand.logo_url" class="w-4 h-4 object-contain rounded">
            <UIcon v-else name="i-lucide-tag" class="w-4 h-4 text-gray-400" />
          </template>
        </USelectMenu>
      </UFormField>

      <UFormField label="Catégories" required>
        <USelectMenu
:model-value="productFormStore.formData.categories"
:items="categoryOptions"
value-key="value"
          label-key="label"
placeholder="Sélectionner des catégories"
multiple
searchable
class="w-full"
          @update:model-value="productFormStore.setFormData({ categories: $event as string[] })" />
      </UFormField>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <UFormField label="Nom du produit" required>
        <UInput
:model-value="productFormStore.formData.name"
placeholder="Ex: T-shirt Nike Dri-FIT"
class="w-full"
          @update:model-value="productFormStore.setFormData({ name: $event })"
@blur="generateSlug" />
      </UFormField>

      <UFormField label="Slug">
        <UInput :model-value="productFormStore.formData.slug" disabled class="w-full" />
      </UFormField>

      <UFormField label="SKU">
        <UInput :model-value="productFormStore.formData.sku" disabled class="w-full" />
      </UFormField>
    </div>

    <USeparator />

    <UFormField label="Description courte">
      <UTextarea
:model-value="productFormStore.formData.short_description"
:rows="3"
        placeholder="Résumé en quelques mots..."
class="w-full"
        @update:model-value="productFormStore.setFormData({ short_description: $event })" />
    </UFormField>

    <UFormField label="Description complète">
      <UTextarea
:model-value="productFormStore.formData.description"
:rows="8"
        placeholder="Description détaillée du produit..."
class="w-full"
        @update:model-value="productFormStore.setFormData({ description: $event })" />
    </UFormField>
  </div>
</template>