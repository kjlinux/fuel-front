<template>
  <Card :class="['transition-all hover:shadow-md', alert.resolved && 'opacity-60']">
    <CardContent class="p-4">
      <div class="flex items-start gap-4">
        <div :class="['flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0', iconBgClass]">
          <component :is="alertIcon" :class="['w-6 h-6', iconColorClass]" />
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <Badge :variant="severityVariant">
                  {{ severityLabel }}
                </Badge>
                <Badge variant="outline" class="text-xs">
                  {{ typeLabel }}
                </Badge>
                <Badge v-if="alert.resolved" variant="success" class="text-xs">
                  <CheckCircle class="w-3 h-3 mr-1" />
                </Badge>
              </div>
              
              <h3 class="font-semibold text-foreground">{{ alert.message }}</h3>
              
              <div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div class="flex items-center gap-1">
                  <MapPin class="w-3 h-3" />
                  <span>{{ getStationName(alert.stationId) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  <span>{{ formatTimestamp(alert.timestamp) }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                @click="$emit('view-details', alert)"
              >
                <Eye class="w-4 h-4" />
              </Button>
              
              <Button
                v-if="!alert.resolved"
                variant="outline"
                size="sm"
                @click="$emit('resolve', alert)"
              >
                <CheckCircle class="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
          
          <div v-if="alert.details" class="mt-3 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            {{ alert.details }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
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
  Thermometer,
  CheckCircle,
  MapPin,
  Clock,
  Eye
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  alert: {
    type: Object,
    required: true
  }
})

defineEmits(['resolve', 'view-details'])

const alertIcons = {
  low_level: Droplet,
  anomaly: TrendingDown,
  disconnected: WifiOff,
  temperature: Thermometer,
  default: AlertTriangle
}

const alertIcon = computed(() => alertIcons[props.alert.type] || alertIcons.default)

const severityConfig = {
  critical: {
    label: 'Critique',
    variant: 'destructive',
    bgClass: 'bg-red-500/10',
    colorClass: 'text-red-500'
  },
  warning: {
    label: 'Attention',
    variant: 'warning',
    bgClass: 'bg-orange-500/10',
    colorClass: 'text-orange-500'
  },
  info: {
    label: 'Info',
    variant: 'default',
    bgClass: 'bg-blue-500/10',
    colorClass: 'text-blue-500'
  }
}

const typeLabels = {
  low_level: 'Niveau bas',
  anomaly: 'Anomalie',
  disconnected: 'Déconnexion',
  temperature: 'Température'
}

const severityLabel = computed(() => severityConfig[props.alert.severity]?.label || 'Inconnu')
const severityVariant = computed(() => severityConfig[props.alert.severity]?.variant || 'default')
const iconBgClass = computed(() => severityConfig[props.alert.severity]?.bgClass || 'bg-muted')
const iconColorClass = computed(() => severityConfig[props.alert.severity]?.colorClass || 'text-muted-foreground')
const typeLabel = computed(() => typeLabels[props.alert.type] || props.alert.type)

function getStationName(stationId) {
  // In real app, fetch from store
  const stations = {
    1: 'Station Total Dakar',
    2: 'Station Shell Rufisque',
    3: 'Station Elton Thiès',
    4: 'Station Oilibya Mbour'
  }
  return stations[stationId] || `Station #${stationId}`
}

function formatTimestamp(timestamp) {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: fr
  })
}
</script>
