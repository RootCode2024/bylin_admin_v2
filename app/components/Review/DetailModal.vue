<script setup lang="ts">
import type { Review } from '~/types/review'
import {
  getReviewStatusLabel,
  getReviewStatusColor,
  getStarsArray,
  formatHelpfulCount,
  hasMedia,
  countImages,
  countVideos
} from '~/utils/review'
import { formatRelativeTimeFR } from '~/utils/formatRelativeTimeFR'

const props = defineProps<{
  review: Review | null
}>()

const emit = defineEmits<{
  approve: [id: string]
  reject: [id: string]
}>()

const open = defineModel<boolean>('open', { default: false })

const starsArray = computed(() => {
  if (!props.review) return { filled: 0, half: false, empty: 5 }
  return getStarsArray(props.review.rating)
})

const canModerate = computed(() => {
  return props.review?.status === 'pending'
})

function handleApprove() {
  if (props.review) {
    emit('approve', props.review.id)
    open.value = false
  }
}

function handleReject() {
  if (props.review) {
    emit('reject', props.review.id)
    open.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Détails de l'avis" :ui="{ content: 'min-w-[60%]' }">
    <template #body>
      <div v-if="review" class="p-6 space-y-6">
        <!-- En-tête avec statut -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <UBadge :color="getReviewStatusColor(review.status)" variant="subtle" size="sm">
                {{ getReviewStatusLabel(review.status) }}
              </UBadge>
              <UBadge v-if="review.is_verified_purchase" color="success" variant="subtle" size="sm">
                <UIcon name="i-lucide-shield-check" class="w-3 h-3 mr-1" />
                Achat vérifié
              </UBadge>
            </div>
            <p class="text-xs text-gray-500">
              Publié {{ formatRelativeTimeFR(review.created_at) }}
            </p>
          </div>

          <!-- Note -->
          <div class="flex items-center gap-1">
            <UIcon v-for="i in starsArray.filled" :key="`filled-${i}`" name="i-lucide-star"
              class="w-5 h-5 text-yellow-500 fill-current" />
            <UIcon v-if="starsArray.half" name="i-lucide-star-half" class="w-5 h-5 text-yellow-500 fill-current" />
            <UIcon v-for="i in starsArray.empty" :key="`empty-${i}`" name="i-lucide-star"
              class="w-5 h-5 text-gray-300" />
          </div>
        </div>

        <!-- Client -->
        <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Client
          </h3>
          <div class="flex items-center gap-3">
            <UAvatar v-if="review.customer?.avatar_url" :src="review.customer.avatar_url"
              :alt="`${review.customer.first_name} ${review.customer.last_name}`" size="lg" />
            <UAvatar v-else icon="i-lucide-user" size="lg" class="bg-gray-100 dark:bg-gray-800" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ review.customer ? `${review.customer.first_name} ${review.customer.last_name}` : 'Client inconnu' }}
              </p>
              <p class="text-sm text-gray-500">
                {{ review.customer?.email || '—' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Produit -->
        <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Produit
          </h3>
          <div v-if="review.product" class="flex items-center gap-3">
            <UAvatar v-if="review.product.thumbnail_url" :src="review.product.thumbnail_url" :alt="review.product.name"
              size="lg" class="rounded-md" />
            <UAvatar v-else icon="i-lucide-package" size="lg" class="bg-gray-100 dark:bg-gray-800 rounded-md" />
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ review.product.name }}
              </p>
              <p class="text-sm text-gray-500">
                SKU: {{ review.product.sku }}
              </p>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500">
            Produit supprimé
          </p>
        </div>

        <!-- Titre et commentaire -->
        <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Avis
          </h3>
          <div class="space-y-3">
            <div v-if="review.title">
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ review.title }}
              </p>
            </div>
            <div v-if="review.comment" class="prose prose-sm dark:prose-invert max-w-none">
              <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {{ review.comment }}
              </p>
            </div>
            <p v-else class="text-sm text-gray-500 italic">
              Aucun commentaire
            </p>
          </div>
        </div>

        <!-- Médias -->
        <div v-if="hasMedia(review)" class="border-t border-gray-200 dark:border-gray-800 pt-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Médias ({{ countImages(review) }} photo{{ countImages(review) > 1 ? 's' : '' }}, {{ countVideos(review) }}
            vidéo{{ countVideos(review) > 1 ? 's' : '' }})
          </h3>
          <div class="grid grid-cols-4 gap-2">
            <div v-for="media in review.media" :key="media.id"
              class="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
              <img v-if="media.media_type === 'image'" :src="media.url" :alt="`Media ${media.id}`"
                class="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div v-else class="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <UIcon name="i-lucide-play-circle" class="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Statistiques
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Utile</p>
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ formatHelpfulCount(review.helpful_count) }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Date de création</p>
              <p class="font-semibold text-gray-900 dark:text-white text-sm">
                {{ formatDateFR(review.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions de modération -->
        <div v-if="canModerate" class="border-t border-gray-200 dark:border-gray-800 pt-4 flex justify-end gap-3">
          <UButton label="Rejeter" color="error" variant="soft" icon="i-lucide-x-circle" @click="handleReject" />
          <UButton label="Approuver" color="success" icon="i-lucide-check-circle" @click="handleApprove" />
        </div>

        <!-- Bouton fermer si pas de modération -->
        <div v-else class="border-t border-gray-200 dark:border-gray-800 pt-4 flex justify-end">
          <UButton label="Fermer" color="neutral" variant="outline" @click="open = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>
