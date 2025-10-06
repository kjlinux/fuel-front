<template>
  <Card class="overflow-hidden">
    <CardContent class="p-6">
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-3">
          <div :class="['flex items-center justify-center w-12 h-12 rounded-lg', typeBgClass]">
            <Droplet :class="['w-6 h-6', typeColorClass]" />
          </div>
          
          <div>
            <h3 class="font-semibold text-foreground">{{ tank.name }}</h3>
            <p class="text-xs text-muted-foreground capitalize">{{ tank.type }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('edit', tank)">
            <Edit class="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-destructive hover:text-destructive"
            @click="$emit('delete', tank)"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div class="flex items-center justify-center mb-6">
        <CircularGauge
          :percentage="tank.percentage"
          :size="160"
          :stroke-width="12"
          :color="gaugeColor"
        >
          <div class="text-center">
            <div class="text-3xl font-bold text-foreground">{{ tank.percentage }}%</div>
            <div class="text-xs text-muted-foreground mt-1">
              {{ formatVolume(tank.level) }} L
            </div>
          </div>
        </CircularGauge>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">Capacité</p>
          <p class="text-sm font-semibold text-foreground">{{ formatVolume(tank.capacity) }} L</p>
        </div>
        
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">Disponible</p>
          <p class="text-sm font-semibold text-foreground">
            {{ formatVolume(tank.capacity - tank.level) }} L
          </p>
        </div>
        
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">Température</p>
          <p class="text-sm font-semibold text-foreground">{{ tank.temperature }}°C</p>
        </div>
        
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">Capteur</p>
          <p class="text-sm font-semibold text-foreground">{{ tank.sensorId }}</p>
        </div>
      </div>

      <div class="pt-4 border-t border-border">
        <Badge :variant="statusVariant" class="w-full justify-center">
          <Activity class="w-3 h-3 mr-1" />
          {{ statusLabel }}
        </Badge>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { Droplet, Edit, Trash2, Activity } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import CircularGauge from '@/components/ui/CircularGauge.vue'

const props = defineProps({
  tank: {
    type: Object,
    required: true
  },
  stationName: String
})

defineEmits(['edit', 'delete'])

const typeConfig = {
  essence: {
    bgClass: 'bg-blue-500/10',
    colorClass: 'text-blue-500'
  },
  gasoil: {
    bgClass: 'bg-orange-500/10',
    colorClass: 'text-orange-500'
  }
}

const typeBgClass = computed(() => typeConfig[props.tank.type]?.bgClass || 'bg-muted')
const typeColorClass = computed(() => typeConfig[props.tank.type]?.colorClass || 'text-muted-foreground')

const gaugeColor = computed(() => {
  if (props.tank.percentage >= 70) return '#22c55e'
  if (props.tank.percentage >= 30) return '#f59e0b'
  return '#ef4444'
})

const statusConfig = {
  normal: { label: 'Normal', variant: 'success' },
  warning: { label: 'Attention', variant: 'warning' },
  critical: { label: 'Critique', variant: 'destructive' }
}

const statusLabel = computed(() => statusConfig[props.tank.status]?.label || 'Inconnu')
const statusVariant = computed(() => statusConfig[props.tank.status]?.variant || 'default')

function formatVolume(volume) {
  return new Intl.NumberFormat('fr-FR').format(volume)
}
</script>
