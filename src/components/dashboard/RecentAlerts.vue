<template>
  <div class="space-y-3">
    <div
      v-for="alert in displayAlerts"
      :key="alert.id"
      class="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
    >
      <div :class="[
        'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
        getAlertBgClass(alert.severity)
      ]">
        <component
          :is="getAlertIcon(alert.type)"
          :class="['w-5 h-5', getAlertColorClass(alert.severity)]"
        />
      </div>
      
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <p class="text-sm font-medium text-foreground">{{ alert.message }}</p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ formatTimestamp(alert.timestamp) }}
            </p>
          </div>
          
          <Badge :variant="getSeverityVariant(alert.severity)" class="flex-shrink-0">
            {{ getSeverityLabel(alert.severity) }}
          </Badge>
        </div>
      </div>
    </div>
    
    <div v-if="displayAlerts.length === 0" class="text-center py-8">
      <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-2" />
      <p class="text-sm text-muted-foreground">Aucune alerte récente</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  AlertTriangle,
  Droplet,
  TrendingDown,
  WifiOff,
  CheckCircle
} from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps({
  alerts: {
    type: Array,
    required: true
  },
  limit: {
    type: Number,
    default: 5
  }
})

const displayAlerts = computed(() => props.alerts.slice(0, props.limit))

function getAlertIcon(type) {
  const icons = {
    low_level: Droplet,
    anomaly: TrendingDown,
    disconnected: WifiOff,
    default: AlertTriangle
  }
  return icons[type] || icons.default
}

function getAlertBgClass(severity) {
  const classes = {
    critical: 'bg-red-500/10',
    warning: 'bg-orange-500/10',
    info: 'bg-blue-500/10'
  }
  return classes[severity] || classes.info
}

function getAlertColorClass(severity) {
  const classes = {
    critical: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-blue-500'
  }
  return classes[severity] || classes.info
}

function getSeverityVariant(severity) {
  const variants = {
    critical: 'destructive',
    warning: 'warning',
    info: 'default'
  }
  return variants[severity] || 'default'
}

function getSeverityLabel(severity) {
  const labels = {
    critical: 'Critique',
    warning: 'Attention',
    info: 'Info'
  }
  return labels[severity] || 'Info'
}

function formatTimestamp(timestamp) {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: fr
  })
}
</script>
