<template>
  <Card class="hover:shadow-lg transition-all cursor-pointer group">
    <CardContent class="p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div :class="[
            'flex items-center justify-center w-12 h-12 rounded-lg',
          ]">
            <Building2 :class="['w-6 h-6', statusColorClass]" />
          </div>
          
          <div>
            <h3 class="font-semibold text-foreground group-hover:text-primary transition-colors">
              {{ station.name }}
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ station.address }}
            </p>
          </div>
        </div>
        
        <Badge :variant="statusVariant">
          {{ statusLabel }}
        </Badge>
      </div>

      <div class="space-y-3 mb-4">
        <div
          v-for="tank in station.tanks"
          :key="tank.id"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-foreground capitalize">
              {{ tank.type }}
            </span>
            <span class="text-muted-foreground">
              {{ formatVolume(tank.level) }} / {{ formatVolume(tank.capacity) }} L
            </span>
          </div>
          
          <div class="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-500', getTankColorClass(tank.percentage)]"
              :style="{ width: `${tank.percentage}%` }"
            />
          </div>
          
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>{{ tank.percentage }}%</span>
            <span>{{ tank.temperature }}°C</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-border">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <User class="w-3 h-3" />
          <span>{{ station.manager }}</span>
        </div>
        
        <div class="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            @click.stop="$emit('edit', station)"
            class="h-8 w-8"
          >
            <Edit class="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            @click.stop="$emit('delete', station)"
            class="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { Building2, User, Edit, Trash2 } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  station: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])

const statusConfig = {
  online: {
    label: 'En ligne',
    variant: 'success',
    bgClass: 'bg-green-500/10',
    colorClass: 'text-green-500'
  },
  warning: {
    label: 'Alerte',
    variant: 'warning',
    bgClass: 'bg-orange-500/10',
    colorClass: 'text-orange-500'
  },
  offline: {
    label: 'Hors ligne',
    variant: 'destructive',
    bgClass: 'bg-red-500/10',
    colorClass: 'text-red-500'
  }
}

const statusLabel = computed(() => statusConfig[props.station.status]?.label || 'Inconnu')
const statusVariant = computed(() => statusConfig[props.station.status]?.variant || 'default')
const statusBgClass = computed(() => statusConfig[props.station.status]?.bgClass || 'bg-muted')
const statusColorClass = computed(() => statusConfig[props.station.status]?.colorClass || 'text-muted-foreground')

function formatVolume(volume) {
  return new Intl.NumberFormat('fr-FR').format(volume)
}

function getTankColorClass(percentage) {
  if (percentage >= 70) return 'bg-green-500'
  if (percentage >= 30) return 'bg-orange-500'
  return 'bg-red-500'
}
</script>
