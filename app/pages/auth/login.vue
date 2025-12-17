<script setup lang="ts">
const auth = useAuthStore()
const toast = useToast()

definePageMeta({
  layout: 'auth',
  // middleware: 'sanctum:guest' // Empêche les utilisateurs connectés de voir cette page
})

const showPassword = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  // 1. Validation basique
  if (!form.email || !form.password) {
    toast.add({
      title: 'Validation',
      description: 'Veuillez remplir tous les champs.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  try {
    // 2. Appel au store
    await auth.login(form)

    // 3. Succès
    toast.add({
      title: 'Connexion réussie',
      description: 'Bienvenue sur Bylin.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    // La redirection est gérée par le config sanctum (onLogin),
    // ou forcez-la ici si besoin:
    await navigateTo('/')

  } catch (err: any) {
    // 4. Gestion d'erreur propre
    const message = err.response?._data?.message || 'Identifiants incorrects ou erreur serveur.'

    toast.add({
      title: 'Erreur',
      description: message,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
}
</script>

<template>
  <div class="space-y-8 animate-fade-in-up">

    <!-- Header Mobile & Titre -->
    <div class="text-center lg:text-left">
      <div class="lg:hidden flex justify-center mb-6">
        <div class="w-12 h-12 rounded-xl bg-[#0066bf] flex items-center justify-center text-white shadow-lg">
          <UIcon name="i-lucide-box" class="w-7 h-7" />
        </div>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Connexion
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Accédez à votre espace Bylin.
      </p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-5">

      <!-- Email -->
      <UFormField label="Email" name="email">
        <UInput
          v-model="form.email"
          icon="i-lucide-mail"
          placeholder="admin@bylin.com"
          type="email"
          autofocus
          size="lg"
          class="w-full"
        />
      </UFormField>

      <!-- Password -->
      <UFormField label="Mot de passe" name="password">
        <UInput
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          icon="i-lucide-lock"
          placeholder="••••••••"
          size="lg"
          class="w-full"
          :ui="{ icon: { trailing: { pointer: 'pointer-events-auto' } } }"
        >
          <template #trailing>
            <UButton
              color="gray"
              variant="ghost"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :padded="false"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Mot de passe oublié -->
      <div class="flex items-center justify-end">
        <NuxtLink
          to="/auth/forgot-password"
          class="text-sm font-medium text-[#005299] hover:text-[#0066bf] dark:text-[#36a2ff] transition-colors"
        >
          Mot de passe oublié ?
        </NuxtLink>
      </div>

      <!-- Bouton Submit -->
      <UButton
        type="submit"
        block
        size="lg"
        :loading="auth.loading"
        class="bg-[#0066bf] hover:bg-[#005299] text-white transition-all duration-200"
      >
        Se connecter
      </UButton>

    </form>
  </div>
</template>
