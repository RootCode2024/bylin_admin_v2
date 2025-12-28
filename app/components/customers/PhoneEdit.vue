<script setup lang="ts">
import { z } from 'zod' // Importez z depuis zod
import { phoneSchema, popularCountries } from '~/utils/validation'
import { formatPhoneNumber } from '~/utils/format'

const props = defineProps<{
  modelValue: { countryCode: string, number: string } | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { countryCode: string, number: string } | null]
}>()

const selectedCountry = ref<'BJ' | 'FR' | 'CI' | 'SN' | 'TG' | 'BF' | 'ML' | 'NE' | 'US' | 'GB' | 'CA'>(props.modelValue?.countryCode as 'BJ' || 'BJ')
const phoneNumber = ref(props.modelValue?.number || '')
const isValidating = ref(false)
const validationStatus = ref<'idle' | 'valid' | 'invalid'>('idle')
const errorMessage = ref('')

// Debounce pour la validation
const debouncedValidation = useDebounceFn(async () => {
  if (!phoneNumber.value) {
    validationStatus.value = 'idle'
    emit('update:modelValue', null)
    return
  }

  isValidating.value = true
  try {
    const result = await phoneSchema.parseAsync({
      countryCode: selectedCountry.value,
      number: phoneNumber.value
    })

    validationStatus.value = 'valid'
    errorMessage.value = ''

    const formatted = formatPhoneNumber(result.countryCode, result.number)
    emit('update:modelValue', {
      countryCode: result.countryCode,
      number: formatted
    })
  } catch (error: unknown) {
    validationStatus.value = 'invalid'

    if (error instanceof z.ZodError) {
      errorMessage.value = error.issues[0]?.message || 'Numéro invalide'
    } else if (error instanceof Error) {
      errorMessage.value = error.message
    } else if (typeof error === 'string') {
      errorMessage.value = error
    } else {
      errorMessage.value = 'Numéro invalide'
    }
  } finally {
    isValidating.value = false
  }
}, 500)

watch([selectedCountry, phoneNumber], () => {
  validationStatus.value = 'idle'
  debouncedValidation()
})

type Country = {
  code: string
  name: string
  dialCode: string
  flag: string
}

const selectedCountryData = computed<Country>(() => {
  return (
    popularCountries.find(c => c.code === selectedCountry.value) ??
    popularCountries[0]!
  )
})

const inputColor = computed(() => {
  if (validationStatus.value === 'valid') return 'success'
  if (validationStatus.value === 'invalid') return 'error'
  return 'primary'
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex gap-2">
      <!-- Sélecteur de pays -->
      <USelectMenu
v-model="selectedCountry"
:items="[...popularCountries]"
value-key="code"
:disabled="disabled"
        class="w-48">
        <template #leading>
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ selectedCountryData.flag }}</span>
            <span>{{ selectedCountryData.dialCode }}</span>
          </div>
        </template>

        <template #item="{ item }">
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ item.flag }}</span>
            <div class="flex-1">
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-sm text-gray-500">{{ item.dialCode }}</div>
            </div>
          </div>
        </template>
      </USelectMenu>

      <!-- Champ de numéro -->
      <UInput
v-model="phoneNumber"
type="tel"
:disabled="disabled"
:color="inputColor"
:loading="isValidating"
        placeholder="00 00 00 00"
class="flex-1">
        <template #trailing>
          <UIcon v-if="validationStatus === 'valid'" name="i-lucide-check-circle" class="text-green-500" />
          <UIcon v-else-if="validationStatus === 'invalid'" name="i-lucide-alert-circle" class="text-red-500" />
        </template>
      </UInput>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-500">
      {{ errorMessage }}
    </p>

    <div v-if="validationStatus === 'valid'" class="flex items-center gap-2 text-sm text-green-600">
      <UIcon name="i-lucide-shield-check" class="w-4 h-4" />
      <span>Numéro vérifié pour {{ selectedCountryData.name }}</span>
    </div>
  </div>
</template>