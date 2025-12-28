<script setup lang="ts">
const { fetchStatistics } = useBrands()

const stats = ref({
  total: 0,
  active: 0,
  inactive: 0,
  with_products: 0,
  trashed: 0
})

const loading = ref(false)

async function loadStats() {
  loading.value = true
  try {
    const data = await fetchStatistics()
    if (data) {
      stats.value = data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})

const items = computed(() => [
  {
    label: 'Total',
    value: stats.value.total,
    icon: 'i-lucide-tag',
    color: 'primary'
  },
  {
    label: 'Actives',
    value: stats.value.active,
    icon: 'i-lucide-check-circle',
    color: 'success'
  },
  {
    label: 'Inactives',
    value: stats.value.inactive,
    icon: 'i-lucide-x-circle',
    color: 'neutral'
  },
  {
    label: 'Avec produits',
    value: stats.value.with_products,
    icon: 'i-lucide-package',
    color: 'info'
  }
])
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <UCard v-for="item in items" :key="item.label" :ui="{ body: 'p-4' }">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted">{{ item.label }}</p>
          <p class="text-2xl font-semibold text-default mt-1">
            {{ loading ? '...' : item.value }}
          </p>
        </div>
        <div
:class="[
          'flex items-center justify-center w-12 h-12 rounded-full',
          `bg-${item.color}/10`
        ]">
          <UIcon
:name="item.icon"
:class="[
            'w-6 h-6',
            `text-${item.color}`
          ]" />
        </div>
      </div>
    </UCard>
  </div>
</template>
