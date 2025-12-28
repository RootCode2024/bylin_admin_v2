<script setup lang="ts">
import { z } from 'zod'
import { emailSchema } from '~/utils/validation'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localEmail = ref(props.modelValue)
const isVerifying = ref(false)
const verificationStatus = ref<'idle' | 'valid' | 'invalid'>('idle')
const errorMessage = ref('')

// Debounce pour la validation
const debouncedValidation = useDebounceFn(async () => {
  if (!localEmail.value) {
    verificationStatus.value = 'idle'
    return
  }

  isVerifying.value = true
  try {
    await emailSchema.parseAsync(localEmail.value)
    verificationStatus.value = 'valid'
    errorMessage.value = ''
    emit('update:modelValue', localEmail.value)
  } catch (error: unknown) {
    verificationStatus.value = 'invalid'

    if (error instanceof z.ZodError) {
      errorMessage.value = error.issues[0]?.message || 'Email invalide'
    } else if (error instanceof Error) {
      errorMessage.value = error.message
    } else if (typeof error === 'string') {
      errorMessage.value = error
    } else {
      errorMessage.value = 'Email invalide'
    }
  } finally {
    isVerifying.value = false
  }
}, 500)

watch(localEmail, () => {
  verificationStatus.value = 'idle'
  debouncedValidation()
})

const inputColor = computed(() => {
  if (verificationStatus.value === 'valid') return 'success'
  if (verificationStatus.value === 'invalid') return 'error'
  return 'primary'
})
</script>

<template>
  <div class="space-y-2">
    <UInput
v-model="localEmail"
type="email"
icon="i-lucide-mail"
:disabled="disabled"
:color="inputColor"
      :loading="isVerifying"
placeholder="exemple@email.com"
class="w-full">
      <template #trailing>
        <UIcon v-if="verificationStatus === 'valid'" name="i-lucide-check-circle" class="text-green-500" />
        <UIcon v-else-if="verificationStatus === 'invalid'" name="i-lucide-alert-circle" class="text-red-500" />
      </template>
    </UInput>

    <p v-if="errorMessage" class="text-sm text-red-500">
      {{ errorMessage }}
    </p>

    <div v-if="verificationStatus === 'valid'" class="flex items-center gap-2 text-sm text-green-600">
      <UIcon name="i-lucide-shield-check" class="w-4 h-4" />
      <span>Email vérifié et sécurisé</span>
    </div>
  </div>
</template>