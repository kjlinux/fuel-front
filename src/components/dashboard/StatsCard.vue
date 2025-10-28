<template>
  <Card class="group hover:border-primary/50 transition-all duration-200">
    <CardContent class="p-6">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-muted-foreground">{{ title }}</p>
          <div class="flex items-baseline gap-2 mt-2">
            <h3 class="text-2xl font-bold text-foreground">{{ value }}</h3>
            <span v-if="total" class="text-sm text-muted-foreground">/ {{ total }}</span>
            <span v-if="subtitle" class="text-sm text-muted-foreground">{{ subtitle }}</span>
          </div>
          
          <div v-if="trend" class="flex items-center gap-1 mt-2">
            <TrendingUp v-if="trend === 'up'" class="w-4 h-4 text-success" />
            <TrendingDown v-if="trend === 'down'" class="w-4 h-4 text-destructive" />
            <Minus v-if="trend === 'stable'" class="w-4 h-4 text-muted-foreground" />
            <span class="text-xs text-muted-foreground">
              {{ trend === 'up' ? 'En hausse' : trend === 'down' ? 'En baisse' : 'Stable' }}
            </span>
          </div>
          
          <Badge v-if="critical" variant="destructive" class="mt-2">
            {{ critical }} critique{{ critical > 1 ? 's' : '' }}
          </Badge>
        </div>
        
        <div :class="['flex items-center justify-center w-12 h-12 rounded-lg transition-transform duration-200 group-hover:scale-110', iconBgClass]">
          <component :is="iconComponent" :class="['w-6 h-6 transition-transform duration-200', iconColorClass]" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import {
  Building2,
  Droplet,
  Gauge,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps({
  title: String,
  value: [String, Number],
  total: [String, Number],
  subtitle: String,
  icon: String,
  color: String,
  trend: String,
  critical: Number
})

const iconComponents = {
  Building2,
  Droplet,
  Gauge,
  AlertTriangle
}

const iconComponent = computed(() => iconComponents[props.icon] || Building2)

const colorClasses = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' }
}

const iconBgClass = computed(() => colorClasses[props.color]?.bg || 'bg-primary/10')
const iconColorClass = computed(() => colorClasses[props.color]?.text || 'text-primary')
</script>
