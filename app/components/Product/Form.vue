<script setup lang="ts">
import type { Product } from '~/types/product'
import { useProductFormStore } from '~/stores/productForm'

const props = defineProps<{
  product?: Product
  isSaving: boolean
  hasUnsavedChanges?: boolean
  isFormValid?: boolean
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  save: []
  duplicate: []
  delete: []
  cancel: []
}>()

const productFormStore = useProductFormStore()
const { brands, fetchBrands } = useBrands()
const { categoryTree, fetchCategoryTree } = useCategories()
const { attributes, fetchAttributes } = useAttributes()

const activeTab = ref('general')

const tabs = computed(() => [
  { key: 'general', label: 'Informations générales', slot: 'general' as const },
  { key: 'pricing', label: 'Prix & Stock', slot: 'pricing' as const },
  {
    key: 'media',
    label: 'Images',
    badge: productFormStore.images.length || undefined,
    slot: 'media' as const
  },
  {
    key: 'variations',
    label: 'Variations',
    badge: productFormStore.formData.variations.length || undefined,
    disabled: !productFormStore.formData.is_variable,
    slot: 'variations' as const
  },
  { key: 'seo', label: 'SEO', slot: 'seo' as const },
  { key: 'advanced', label: 'Avancé', slot: 'advanced' as const }
])

const pageTitle = computed(() =>
  props.mode === 'create'
    ? 'Créer un produit'
    : props.product?.name || 'Modifier le produit'
)

const pageDescription = computed(() =>
  props.mode === 'create'
    ? 'Ajouter un nouveau produit au catalogue'
    : `SKU: ${props.product?.sku}`
)

const saveButtonLabel = computed(() => props.mode === 'create' ? 'Créer le produit' : 'Sauvegarder')
const saveButtonIcon = computed(() => props.mode === 'create' ? 'i-lucide-plus' : 'i-lucide-save')

onMounted(async () => {
  await Promise.all([fetchBrands(), fetchCategoryTree(), fetchAttributes()])
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="emit('cancel')" />
          <div class="ml-4">
            <h1 class="text-xl font-semibold">{{ pageTitle }}</h1>
            <p class="text-sm text-gray-500">{{ pageDescription }}</p>
          </div>
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UBadge v-if="mode === 'edit' && hasUnsavedChanges" color="warning" variant="soft" size="sm">
              Non sauvegardé
            </UBadge>

            <UDropdownMenu v-if="mode === 'edit'" :items="[
              [
                { label: 'Dupliquer', icon: 'i-lucide-copy', onSelect: () => emit('duplicate') },
                {
                  label: 'Voir sur le site',
                  icon: 'i-lucide-external-link',
                  to: `/products/${product?.slug}`,
                  target: '_blank'
                }
              ],
              [{
                label: 'Supprimer',
                icon: 'i-lucide-trash',
                color: 'error',
                onSelect: () => emit('delete')
              }]
            ]">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" />
            </UDropdownMenu>

            <!-- Cancel button (create only) -->
            <UButton v-if="mode === 'create'" label="Annuler" color="neutral" variant="ghost" @click="emit('cancel')" />

            <!-- Save button -->
            <UButton :label="saveButtonLabel" :icon="saveButtonIcon" color="primary" :loading="isSaving"
              :disabled="mode === 'create' ? !isFormValid : !hasUnsavedChanges" @click="emit('save')" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col lg:flex-row gap-6">
        <ProductEditSidebar :product="product" :mode="mode" />

        <div class="flex-1">
          <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #general>
              <ProductEditGeneral :brands="brands" :categories="categoryTree" :mode="mode" />
            </template>

            <template #pricing>
              <ProductEditPricing :mode="mode" />
            </template>

            <template #media>
              <ProductEditMedia :mode="mode" />
            </template>

            <template #variations>
              <ProductEditVariations :attributes="attributes" :categories="categoryTree" :mode="mode" />
            </template>

            <template #seo>
              <ProductEditSeo :mode="mode" />
            </template>

            <template #advanced>
              <ProductEditAdvanced :product-id="product?.id" :mode="mode" />
            </template>
          </UTabs>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
