<script setup lang="ts">

definePageMeta({
  layout: 'default',
  title: 'Créer un produit',
  description: 'Ajouter un nouveau produit au catalogue'
})

const router = useRouter()
const toast = useToast()
const productFormStore = useProductFormStore()
const { createProduct } = useProduct()

const isSaving = ref(false)

// Validation
const isFormValid = computed(() => {
  const form = productFormStore.formData

  // Validation de base
  const basicValidation = !!(
    form.name?.trim().length > 0 &&
    form.categories.length > 0 &&
    form.brand_id &&
    form.price > 0
  )

  // Validation spécifique pour les produits variables
  if (form.is_variable) {

    if (form.variations.length === 0) {
      return false
    }

    const variationsValid = form.variations.every(v =>
      v.variation_name?.trim() &&
      v.price > 0 &&
      v.stock_quantity >= 0
    )

    return basicValidation && variationsValid
  }

  return basicValidation
})

async function handleSave() {
  if (!isFormValid.value) {
    toast.add({
      title: 'Erreur de validation',
      description: productFormStore.formData.is_variable
        ? 'Veuillez remplir tous les champs requis et ajouter au moins une variation valide'
        : 'Veuillez remplir tous les champs requis',
      color: 'error'
    })
    return
  }

  isSaving.value = true

  try {
    const imageFiles = productFormStore.images
      .filter(img => img.file)
      .map(img => img.file)

    const dataToSend: any = {
      ...productFormStore.formData,
      price: Math.max(0.01, productFormStore.formData.price || 0),
      stock_quantity: Math.max(0, productFormStore.formData.stock_quantity || 0),
      low_stock_threshold: Math.max(0, productFormStore.formData.low_stock_threshold || 0),
      // Images
      images: imageFiles,
      images_to_delete: []
    }

    if (!dataToSend.compare_price || dataToSend.compare_price <= 0) {
      delete dataToSend.compare_price
    }

    if (!dataToSend.cost_price || dataToSend.cost_price <= 0) {
      delete dataToSend.cost_price
    }

    if (!dataToSend.preorder_limit || dataToSend.preorder_limit <= 0) {
      delete dataToSend.preorder_limit
    }

    // Gestion spécifique pour les variations
    if (dataToSend.is_variable && dataToSend.variations.length > 0) {
      dataToSend.variations = dataToSend.variations.map((variation: any) => {
        const cleanVariation = {
          ...variation,
          variation_name: variation.variation_name || 'Nouvelle variation',
          price: Math.max(0.01, variation.price || 0),
          stock_quantity: Math.max(0, variation.stock_quantity || 0),
          stock_status: variation.stock_status || (variation.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'),
          is_active: variation.is_active !== false,
          attributes: variation.attributes || {}
        }

        if (!cleanVariation.compare_price || cleanVariation.compare_price <= 0) {
          delete cleanVariation.compare_price
        }

        if (!cleanVariation.cost_price || cleanVariation.cost_price <= 0) {
          delete cleanVariation.cost_price
        }

        if (!cleanVariation.sku) {
          delete cleanVariation.sku
        }

        if (!cleanVariation.barcode) {
          delete cleanVariation.barcode
        }

        return cleanVariation
      })
    } else {
      dataToSend.variations = []
    }

    // Authentification Bylin
    if (dataToSend.requires_authenticity) {
      dataToSend.authenticity_codes_count = Math.max(1, dataToSend.authenticity_codes_count || 10)
    } else {
      delete dataToSend.authenticity_codes_count
    }

    const created = await createProduct(dataToSend)

    if (created) {
      toast.add({
        title: 'Produit créé',
        description: 'Le produit a été créé avec succès',
        color: 'success'
      })

      router.push(`/products/${created.id}`)
    }
  } catch (error: any) {
    console.error('Erreur complète:', error)

    if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      Object.keys(errors).forEach(field => {
        let fieldName = field
        if (field.includes('variations')) {
          const match = field.match(/variations\.(\d+)\.(.+)/)
          if (match) {
            const index = parseInt(match[1] as string) + 1
            const subField = match[2]
            fieldName = `Variation ${index} - ${subField}`
          }
        }

        toast.add({
          title: `Erreur: ${fieldName}`,
          description: Array.isArray(errors[field]) ? errors[field][0] : errors[field],
          color: 'error',
          duration: 5000
        })
      })
    } else {
      toast.add({
        title: 'Erreur de création',
        description: error.message || 'Une erreur est survenue lors de la création du produit',
        color: 'error'
      })
    }
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  productFormStore.resetFormData()
})
</script>

<template>
  <ProductForm
:is-saving="isSaving"
:is-form-valid="isFormValid"
mode="create"
@save="handleSave"
    @cancel="router.push('/products')" />
</template>
