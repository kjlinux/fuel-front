<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'secondary', 'destructive', 'outline', 'ghost'].includes(value)
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'sm', 'lg', 'icon'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95'

  const variants = {
    default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow',
    outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-primary/50',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  }
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3 text-sm',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  }
  
  return `${base} ${variants[props.variant]} ${sizes[props.size]}`
})
</script>
