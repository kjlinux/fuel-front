<template>
  <div class="relative h-[300px] bg-muted/20 rounded-lg overflow-hidden">
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="relative w-full h-full">
        <div class="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div
          v-for="(station, index) in stations"
          :key="station.id"
          :style="getMarkerPosition(index)"
          class="absolute transform -translate-x-1/2 -translate-y-1/2"
        >
          <button
            @click="selectedStation = station"
            :class="[
              'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all hover:scale-110',
              station.status === 'online'
                ? 'bg-green-500/20 border-green-500'
                : 'bg-orange-500/20 border-orange-500'
            ]"
          >
            <MapPin :class="[
              'w-5 h-5',
              station.status === 'online' ? 'text-green-500' : 'text-orange-500'
            ]" />
            
            <span
              v-if="station.status === 'online'"
              class="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"
            />
          </button>
          
          <div class="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <div class="bg-card border border-border rounded-md px-2 py-1 shadow-lg">
              <p class="text-xs font-medium text-foreground">{{ station.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg">
      <div class="flex items-center gap-4 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-green-500" />
          <span class="text-muted-foreground">En ligne</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-orange-500" />
          <span class="text-muted-foreground">Alerte</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MapPin } from 'lucide-vue-next'

const props = defineProps({
  stations: {
    type: Array,
    required: true
  }
})

const selectedStation = ref(null)

// Position stations on the map (mock positions)
function getMarkerPosition(index) {
  const positions = [
    { top: '40%', left: '30%' },
    { top: '35%', left: '55%' },
    { top: '60%', left: '45%' },
    { top: '70%', left: '65%' }
  ]
  
  return positions[index] || { top: '50%', left: '50%' }
}
</script>
