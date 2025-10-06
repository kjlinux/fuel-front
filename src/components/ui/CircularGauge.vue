<template>
  <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="transform -rotate-90">
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="backgroundColor"
        :stroke-width="strokeWidth"
      />
      
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        class="transition-all duration-500"
      />
    </svg>
    
    <div class="absolute inset-0 flex items-center justify-center">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percentage: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100
  },
  size: {
    type: Number,
    default: 80
  },
  strokeWidth: {
    type: Number,
    default: 6
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  backgroundColor: {
    type: String,
    default: 'hsl(var(--muted))'
  }
})

const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
  return circumference.value - (props.percentage / 100) * circumference.value
})
</script>
