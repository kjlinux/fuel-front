<template>
  <div :class="badgeClasses">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'secondary', 'destructive', 'success', 'warning', 'info', 'outline'].includes(value)
  }
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground shadow-sm',
    primary: 'border-transparent bg-primary text-primary-foreground shadow-sm',
    secondary: 'border-transparent bg-secondary text-secondary-foreground shadow-sm',
    destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-sm',
    success: 'border-transparent bg-success text-success-foreground shadow-sm',
    warning: 'border-transparent bg-warning text-warning-foreground shadow-sm',
    info: 'border-transparent bg-info text-info-foreground shadow-sm',
    outline: 'text-foreground border-border'
  }

  return `${base} ${variants[props.variant]}`
})
</script>
