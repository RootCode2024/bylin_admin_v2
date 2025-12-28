<script setup lang="ts">
const user = ref({
  name: 'Admin User',
  email: 'admin@boutique.com',
  currentPassword: '',
  newPassword: ''
})
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Mon Profil" />
    <div class="p-4 max-w-2xl mx-auto space-y-6">
      <div class="flex items-center gap-4 mb-6">
        <UAvatar src="https://github.com/benjamincanac.png" size="3xl" />
        <UButton label="Changer l'avatar" variant="ghost" />
      </div>

      <UCard>
        <div class="space-y-4">
            <UFormGroup label="Nom complet">
                <UInput v-model="user.name" />
            </UFormGroup>
            <UFormGroup label="Adresse Email">
                <UInput v-model="user.email" disabled />
            </UFormGroup>
        </div>
      </UCard>

      <UCard>
        <template #header><h3 class="font-bold">Sécurité</h3></template>
        <div class="space-y-4">
            <UFormGroup label="Mot de passe actuel">
                <UInput v-model="user.currentPassword" type="password" />
            </UFormGroup>
            <UFormGroup label="Nouveau mot de passe">
                <UInput v-model="user.newPassword" type="password" />
            </UFormGroup>
        </div>
        <template #footer>
            <UButton label="Mettre à jour le mot de passe" color="neutral" variant="outline" />
        </template>
      </UCard>
    </div>
  </UDashboardPanel>
</template>
