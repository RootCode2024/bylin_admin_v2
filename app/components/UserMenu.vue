<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const appConfig = useAppConfig()
const auth = useAuthStore()

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

// Définition du type pour l'item avec chip
interface DropdownMenuItemWithChip extends DropdownMenuItem {
  chip?: string
}

const user = computed(() => {
  const realUser = Array.isArray(auth.user) ? auth.user[0] : auth.user

  return {
    name: realUser?.name || 'Utilisateur',
    email: realUser?.email || '',
    avatar: {
      src: realUser?.avatar_url || undefined,
      alt: realUser?.name || 'User'
    }
  }
})

const handleLogout = async () => {
  await auth.logout()
}

const items = computed<DropdownMenuItem[][]>(() => ([
  [{
    type: 'label',
    label: user.value.name,
    avatar: user.value.avatar
  }],
  [{
    label: 'Mon Profil',
    icon: 'i-lucide-user',
    to: '/settings'
  }],
  [{
    label: 'Thème',
    icon: 'i-lucide-palette',
    children: [{
      label: 'Primaire',
      slot: 'chip',
      chip: appConfig.ui.colors.primary,
      content: { align: 'center', collisionPadding: 16 },
      children: colors.map(color => ({
        label: color,
        chip: color,
        slot: 'chip',
        checked: appConfig.ui.colors.primary === color,
        type: 'checkbox',
        onSelect: (e) => { e.preventDefault(); appConfig.ui.colors.primary = color }
      }))
    }, {
      label: 'Neutre',
      slot: 'chip',
      chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
      content: { align: 'end', collisionPadding: 16 },
      children: neutrals.map(color => ({
        label: color,
        chip: color === 'neutral' ? 'old-neutral' : color,
        slot: 'chip',
        type: 'checkbox',
        checked: appConfig.ui.colors.neutral === color,
        onSelect: (e) => { e.preventDefault(); appConfig.ui.colors.neutral = color }
      }))
    }]
  }, {
    label: 'Apparence',
    icon: 'i-lucide-sun-moon',
    children: [{
      label: 'Clair',
      icon: 'i-lucide-sun',
      type: 'checkbox',
      checked: colorMode.value === 'light',
      onSelect(e: Event) { e.preventDefault(); colorMode.preference = 'light' }
    }, {
      label: 'Sombre',
      icon: 'i-lucide-moon',
      type: 'checkbox',
      checked: colorMode.value === 'dark',
      onUpdateChecked(checked: boolean) { if (checked) colorMode.preference = 'dark' },
      onSelect(e: Event) { e.preventDefault() }
    }]
  }],
  [{
    label: 'Se déconnecter',
    icon: 'i-lucide-log-out',
    onSelect: handleLogout
  }]
]))
</script>

<template>
  <UDropdownMenu
:items="items"
:content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }">
    <UButton
v-bind="{
      ...user,
      label: collapsed ? undefined : user.name,
      trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
    }"
color="neutral"
variant="ghost"
block
:square="collapsed"
class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }" />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
:style="{
          '--chip-light': `var(--color-${(item as DropdownMenuItemWithChip).chip}-500)`,
          '--chip-dark': `var(--color-${(item as DropdownMenuItemWithChip).chip}-400)`
        }" />
      </div>
    </template>
  </UDropdownMenu>
</template>
