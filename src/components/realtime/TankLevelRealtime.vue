<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>{{ tankName }}</CardTitle>
          <CardDescription>Niveau en temps réel</CardDescription>
        </div>
        
        <div :class="['flex items-center gap-2 px-3 py-1 rounded-full', statusBgClass]">
          <div :class="['w-2 h-2 rounded-full', statusDotClass]" />
          <span :class="['text-xs font-medium', statusTextClass]">
            {{ statusText }}
          </span>
        </div>
      </div>
    </CardHeader>
    
    <CardContent class="space-y-6">
      <div class="flex items-center gap-6">
        <div class="relative w-24 h-48 border-2 border-border rounded-lg overflow-hidden bg-muted/30">
          <div
            :class="['absolute bottom-0 left-0 right-0 transition-all duration-1000', fuelColorClass]"
            :style="{ height: `${level}%` }"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
          </div>
          
          <div class="absolute inset-0 flex flex-col justify-between py-2 px-1">
            <div v-for="marker in [100, 75, 50, 25, 0]" :key="marker" class="flex items-center">
              <div class="w-2 h-px bg-border" />
              <span class="text-[10px] text-muted-foreground ml-1">{{ marker }}%</span>
            </div>
          </div>
          
          <div
            class="absolute left-0 right-0 border-t-2 border-primary transition-all duration-1000"
            :style="{ bottom: `${level}%` }"
          >
            <div class="absolute right-0 top-0 transform translate-x-full -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
              {{ level.toFixed(1) }}%
            </div>
          </div>
        </div>

        <div class="flex-1 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">Volume actuel</p>
              <p class="text-lg font-bold text-foreground">{{ formatVolume(volume) }} L</p>
            </div>
            
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">Capacité</p>
              <p class="text-lg font-bold text-foreground">{{ formatVolume(capacity) }} L</p>
            </div>
            
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">Température</p>
              <p class="text-lg font-bold text-foreground">{{ temperature }}°C</p>
            </div>
            
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">Dernière MAJ</p>
              <p class="text-lg font-bold text-foreground">{{ lastUpdate }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Niveau de remplissage</span>
              <span class="font-medium text-foreground">{{ level.toFixed(1) }}%</span>
            </div>
            <div class="h-3 bg-muted rounded-full overflow-hidden">
              <div
                :class="['h-full transition-all duration-1000', fuelColorClass]"
                :style="{ width: `${level}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-border">
        <h4 class="text-sm font-semibold text-foreground mb-4">Évolution du niveau</h4>
        <RealtimeChart
          :topic="`fuel/station/${stationId}/tank/${tankId}/level`"
          data-key="level"
          unit="%"
          :y-domain="[0, 100]"
          :max-data-points="30"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import RealtimeChart from '@/components/realtime/RealtimeChart.vue'
import mqttService from '@/services/mqttService'

const props = defineProps({
  stationId: {
    type: Number,
    required: true
  },
  tankId: {
    type: Number,
    required: true
  },
  tankName: {
    type: String,
    required: true
  },
  fuelType: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: 15000
  }
})

const level = ref(75)
const volume = ref(11250)
const temperature = ref(25)
const lastUpdate = ref('--:--')

let unsubscribe = null

const fuelColorClass = computed(() => {
  if (level.value < 20) return 'bg-red-500'
  if (level.value < 40) return 'bg-orange-500'
  return props.fuelType === 'essence' ? 'bg-blue-500' : 'bg-amber-500'
})

const statusText = computed(() => {
  if (level.value < 20) return 'Niveau critique'
  if (level.value < 40) return 'Niveau bas'
  return 'Normal'
})

const statusBgClass = computed(() => {
  if (level.value < 20) return 'bg-red-500/10'
  if (level.value < 40) return 'bg-orange-500/10'
  return 'bg-green-500/10'
})

const statusDotClass = computed(() => {
  if (level.value < 20) return 'bg-red-500 animate-pulse'
  if (level.value < 40) return 'bg-orange-500'
  return 'bg-green-500'
})

const statusTextClass = computed(() => {
  if (level.value < 20) return 'text-red-500'
  if (level.value < 40) return 'text-orange-500'
  return 'text-green-500'
})

function formatVolume(vol) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(vol))
}

function handleLevelUpdate(data) {
  if (data.tankId !== props.tankId) return

  level.value = data.level
  volume.value = data.volume
  temperature.value = data.temperature
  lastUpdate.value = format(new Date(), 'HH:mm:ss')
}

onMounted(() => {
  // Subscribe to tank level updates
  unsubscribe = mqttService.subscribe(
    `fuel/station/${props.stationId}/tank/${props.tankId}/level`,
    handleLevelUpdate
  )
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>
