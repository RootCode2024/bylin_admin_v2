<script setup lang="ts">
import type { Product, ProductStatus } from '~/types/product'
import { useProductFormStore } from '~/stores/productForm'

const props = defineProps<{
  product?: Product
  mode?: 'create' | 'edit'
}>()

const productFormStore = useProductFormStore()
const { updateStock, togglePreorder } = useProduct()
const toast = useToast()

const stockAdjustment = ref({ operation: 'set' as 'set' | 'add' | 'sub', quantity: 0 })

const statusOptions = [
  { label: 'Brouillon', value: 'draft', color: 'neutral' },
  { label: 'Actif', value: 'active', color: 'success' },
  { label: 'Inactif', value: 'inactive', color: 'error' },
  { label: 'Rupture', value: 'out_of_stock', color: 'warning' },
  { label: 'Précommande', value: 'preorder', color: 'info' },
  { label: 'Arrêté', value: 'discontinued', color: 'neutral' }
]

const isEditMode = computed(() => props.mode === 'edit' && !!props.product)

async function handleStockUpdate() {
  if (!props.product?.id) {
    toast.add({
      title: 'Action non disponible',
      description: 'Sauvegardez d\'abord le produit',
      color: 'warning'
    })
    return
  }

  if (stockAdjustment.value.quantity === 0) {
    toast.add({
      title: 'Quantité requise',
      description: 'Veuillez entrer une quantité',
      color: 'warning'
    })
    return
  }

  const success = await updateStock(
    props.product.id,
    stockAdjustment.value.quantity,
    stockAdjustment.value.operation
  )

  if (success) {
    stockAdjustment.value.quantity = 0
    toast.add({ title: 'Stock mis à jour', color: 'success' })
  }
}

async function handleTogglePreorder() {
  if (!props.product?.id) {
    toast.add({
      title: 'Action non disponible',
      description: 'Sauvegardez d\'abord le produit',
      color: 'warning'
    })
    return
  }

  const enable = !productFormStore.formData.is_preorder_enabled
  const success = await togglePreorder(
    props.product.id,
    enable,
    enable ? {
      available_date: productFormStore.formData.preorder_available_date || '',
      limit: productFormStore.formData.preorder_limit,
      message: productFormStore.formData.preorder_message || ''
    } : undefined
  )

  if (success) {
    productFormStore.setFormData({ is_preorder_enabled: enable })
    toast.add({
      title: enable ? 'Précommande activée' : 'Précommande désactivée',
      color: 'success'
    })
  }
}
</script>

<template>
  <div class="lg:w-[30%] space-y-6">
    <!-- Info Card - Mode création uniquement (déplacé en haut) -->
    <UAlert
v-if="!isEditMode"
icon="i-lucide-info"
color="primary"
variant="soft"
title="Conseil"
      description="Remplissez au minimum le nom, la marque et le prix pour créer le produit. Vous pourrez compléter les autres informations plus tard." />

    <!-- Preview Card -->
    <UCard>
      <template #header>
        <h3 class="text-sm font-semibold">Aperçu produit</h3>
      </template>

      <div class="space-y-5">
        <!-- Image principale -->
        <div
          class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <img
v-if="productFormStore.images[0]?.url"
:src="productFormStore.images[0].url"
            :alt="productFormStore.formData.name || 'Aperçu'"
class="w-full h-full object-cover">
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon name="i-lucide-image" class="w-12 h-12 text-gray-400" />
          </div>
        </div>

        <!-- Statut -->
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block uppercase tracking-wide">
            Statut du produit
          </label>
          <USelectMenu
:model-value="productFormStore.formData.status"
            :items="statusOptions"
            value-key="value"
label-key="label"
size="md"
class="w-full"
@update:model-value="productFormStore.setFormData({ status: $event as ProductStatus })" />
        </div>

        <!-- Stock -->
        <div v-if="productFormStore.formData.track_inventory">
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block uppercase tracking-wide">
            {{ isEditMode ? 'Gestion du stock' : 'Stock initial' }}
          </label>

          <template v-if="isEditMode">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Stock actuel</span>
                <UBadge
:label="`${product?.stock_quantity || 0} unités`"
                  :color="(product?.stock_quantity || 0) > 0 ? 'success' : 'error'"
variant="subtle"
size="lg" />
              </div>

              <!-- Divider -->
              <USeparator />

              <div class="space-y-3">
                <label class="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                  Ajuster le stock
                </label>
                <USelectMenu
v-model="stockAdjustment.operation"
:items="[
                  { label: 'Définir', value: 'set' },
                  { label: 'Ajouter', value: 'add' },
                  { label: 'Retirer', value: 'sub' }
                ]"
value-key="value"
label-key="label"
size="md"
class="w-full" />

                <div class="flex gap-2">
                  <UInput
v-model.number="stockAdjustment.quantity"
type="number"
placeholder="Quantité"
size="md"
                    class="flex-1" />
                  <UButton
icon="i-lucide-check"
size="md"
color="primary"
@click="handleStockUpdate" />
                </div>
              </div>
            </div>
          </template>

          <!-- Mode création: Simple input -->
          <template v-else>
            <UInput
:model-value="productFormStore.formData.stock_quantity"
              type="number"
placeholder="0"
              size="md"
class="w-full"
@update:model-value="productFormStore.setFormData({ stock_quantity: Number($event) })" />
          </template>
        </div>
      </div>
    </UCard>

    <!-- Actions rapides Card -->
    <UCard>
      <template #header>
        <h3 class="text-sm font-semibold">Actions rapides</h3>
      </template>

      <div class="space-y-4">
        <!-- Produit mis en avant -->
        <div class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-star" class="w-4 h-4 text-gray-500" />
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Produit mis en avant
            </label>
          </div>
          <USwitch
:model-value="productFormStore.formData.is_featured"
            @update:model-value="productFormStore.setFormData({ is_featured: $event })" />
        </div>

        <div class="border-t border-gray-200 dark:border-gray-800"/>

        <!-- Nouveau produit -->
        <div class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-gray-500" />
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nouveau produit
            </label>
          </div>
          <USwitch
:model-value="productFormStore.formData.is_new"
            @update:model-value="productFormStore.setFormData({ is_new: $event })" />
        </div>

        <div class="border-t border-gray-200 dark:border-gray-800"/>

        <!-- En promotion -->
        <div class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-tag" class="w-4 h-4 text-gray-500" />
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              En promotion
            </label>
          </div>
          <USwitch
:model-value="productFormStore.formData.is_on_sale"
            @update:model-value="productFormStore.setFormData({ is_on_sale: $event })" />
        </div>
      </div>
    </UCard>

    <!-- Précommande Card -->
    <UCard v-if="productFormStore.formData.status === 'preorder' || productFormStore.formData.is_preorder_enabled">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar-clock" class="w-4 h-4" />
            <h3 class="text-sm font-semibold">Précommande</h3>
          </div>
          <USwitch
:model-value="productFormStore.formData.is_preorder_enabled"
            @update:model-value="isEditMode ? handleTogglePreorder() : productFormStore.setFormData({ is_preorder_enabled: $event })" />
        </div>
      </template>

      <div v-if="productFormStore.formData.is_preorder_enabled" class="space-y-4">
        <UFormField label="Date de disponibilité">
          <UInput
:model-value="productFormStore.formData.preorder_available_date"
            type="date"
size="md"
            class="w-full"
@update:model-value="productFormStore.setFormData({ preorder_available_date: $event })" />
        </UFormField>

        <UFormField label="Limite de précommandes">
          <UInput
:model-value="productFormStore.formData.preorder_limit"
            type="number"
            placeholder="Illimité"
size="md"
class="w-full"
@update:model-value="productFormStore.setFormData({ preorder_limit: $event ? Number($event) : undefined })" />
        </UFormField>

        <!-- Compteur précommandes -->
        <div
v-if="isEditMode && product?.preorder_count && product.preorder_count > 0"
          class="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <UIcon name="i-lucide-shopping-cart" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
            {{ product.preorder_count }} précommande(s) en cours
          </span>
        </div>
      </div>
    </UCard>
  </div>
</template>
