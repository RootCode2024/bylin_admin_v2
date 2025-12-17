<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'sanctum:guest' // Redirige vers l'accueil si déjà connecté
})

const toast = useToast()
const client = useSanctumClient() // Client HTTP configuré automatiquement par le module

const email = ref('')
const loading = ref(false)
const emailSent = ref(false)

const handleResetLink = async () => {
  if (!email.value) {
    toast.add({
      title: 'Email requis',
      description: 'Veuillez entrer votre adresse email.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  loading.value = true

  try {
    // Adapter l'URL selon ta route Laravel (ex: /forgot-password ou /api/v1/auth/forgot-password)
    // Laravel attend généralement un champ 'email'
    await client('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    })

    emailSent.value = true

    toast.add({
      title: 'Email envoyé',
      description: 'Si ce compte existe, vous recevrez un lien de réinitialisation.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

  } catch (error: any) {
    // Gestion des erreurs (ex: throttled, erreur serveur)
    const message = error.response?._data?.message || 'Une erreur est survenue.'

    toast.add({
      title: 'Erreur',
      description: message,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-8 animate-fade-in-up">

    <!-- Header -->
    <div class="text-center lg:text-left">
      <div class="lg:hidden flex justify-center mb-6">
        <div class="w-12 h-12 rounded-xl bg-[#0066bf] flex items-center justify-center text-white shadow-lg">
          <UIcon name="i-lucide-key-round" class="w-7 h-7" />
        </div>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Mot de passe oublié ?
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>
    </div>

    <!-- État Succès (Email envoyé) -->
    <div v-if="emailSent" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 text-center space-y-4">
      <div class="flex justify-center">
        <UIcon name="i-lucide-mail-check" class="w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 class="font-medium text-green-900 dark:text-green-300">Vérifiez vos emails</h3>
        <p class="text-sm text-green-700 dark:text-green-400 mt-1">
          Un lien a été envoyé à <strong>{{ email }}</strong>.
        </p>
      </div>
      <UButton
        to="/auth/login"
        variant="outline"
        color="green"
        block
        class="mt-2"
      >
        Retour à la connexion
      </UButton>
    </div>

    <!-- Formulaire -->
    <form v-else @submit.prevent="handleResetLink" class="space-y-6">
      <UFormField label="Adresse Email" name="email">
        <UInput
          v-model="email"
          type="email"
          icon="i-lucide-mail"
          placeholder="admin@bylin.com"
          size="lg"
          autofocus
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        block
        size="lg"
        :loading="loading"
        class="bg-[#0066bf] hover:bg-[#005299] text-white transition-all duration-200"
      >
        Envoyer le lien de réinitialisation
      </UButton>

      <div class="text-center">
        <NuxtLink
          to="/auth/login"
          class="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          Retour à la connexion
        </NuxtLink>
      </div>
    </form>

  </div>
</template>
