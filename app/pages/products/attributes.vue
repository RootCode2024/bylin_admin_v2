<script setup lang="ts">
const data = ref([
  { id: 1, name: 'Taille', type: 'select', values: ['S', 'M', 'L', 'XL'] },
  { id: 2, name: 'Couleur', type: 'color', values: ['Rouge', 'Bleu', 'Noir'] },
])
// Implémentation simplifiée pour garder la longueur raisonnable, utiliser le modèle Table ci-dessus si besoin.
</script>
<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Attributs" />
    <div class="p-4 grid gap-4">
      <UCard v-for="attr in data" :key="attr.id">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold">{{ attr.name }}</h3>
            <div class="flex gap-2 mt-2">
              <UBadge v-for="val in attr.values" :key="val" variant="subtle">{{ val }}</UBadge>
            </div>
          </div>
          <UButton icon="i-lucide-settings" variant="ghost" />
        </div>
      </UCard>
    </div>
  </UDashboardPanel>
</template>
