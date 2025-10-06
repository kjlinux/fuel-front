<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold text-foreground">Monitoring Temps Réel</h2>
        <p class="text-muted-foreground mt-1">
          Surveillance en direct des stations et cuves
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <div :class="['flex items-center gap-2 px-4 py-2 rounded-lg', connectionBgClass]">
          <div :class="['w-2 h-2 rounded-full', connectionDotClass]" />
          <span :class="['text-sm font-medium', connectionTextClass]">
            {{ connectionStatus }}
          </span>
        </div>
        
        <Button variant="outline" @click="toggleConnection">
          <Power class="w-4 h-4 mr-2" />
          {{ connected ? 'Déconnecter' : 'Connecter' }}
        </Button>
      </div>
    </div>

    <Card>
      <CardContent class="p-4">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-foreground">Station:</label>
          <select
            v-model="selectedStation"
            class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="1">Station Total Dakar</option>
            <option value="2">Station Shell Rufisque</option>
            <option value="3">Station Elton Thiès</option>
            <option value="4">Station Oilibya Mbour</option>
          </select>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-6 lg:grid-cols-2">
      <TankLevelRealtime
        :station-id="Number(selectedStation)"
        :tank-id="1"
        tank-name="Cuve Essence 1"
        fuel-type="essence"
        :capacity="15000"
      />
      
      <TankLevelRealtime
        :station-id="Number(selectedStation)"
        :tank-id="2"
        tank-name="Cuve Gasoil 1"
        fuel-type="gasoil"
        :capacity="20000"
      />
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Messages reçus</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ messagesReceived }}</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Activity class="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Latence moyenne</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ averageLatency }} ms</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Zap class="w-6 h-6 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Capteurs actifs</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ activeSensors }}/8</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
              <Radio class="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Power, Activity, Zap, Radio } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import TankLevelRealtime from '@/components/realtime/TankLevelRealtime.vue'
import mqttService from '@/services/mqttService'

const selectedStation = ref('1')
const connected = ref(false)
const messagesReceived = ref(0)
const averageLatency = ref(45)
const activeSensors = ref(8)

const connectionStatus = computed(() => 
  connected.value ? 'Connecté MQTT' : 'Déconnecté'
)

const connectionBgClass = computed(() => 
  connected.value ? 'bg-green-500/10' : 'bg-red-500/10'
)

const connectionDotClass = computed(() => 
  connected.value ? 'bg-green-500 animate-pulse' : 'bg-red-500'
)

const connectionTextClass = computed(() => 
  connected.value ? 'text-green-500' : 'text-red-500'
)

function handleConnection(status) {
  connected.value = status.status === 'connected'
}

function handleMessage() {
  messagesReceived.value++
}

function toggleConnection() {
  if (connected.value) {
    mqttService.disconnect()
  } else {
    mqttService.connect()
  }
}

onMounted(() => {
  // Connect to MQTT
  mqttService.connect()
  
  // Subscribe to connection status
  mqttService.subscribe('connection', handleConnection)
  
  // Subscribe to all messages for counting
  mqttService.subscribe('*', handleMessage)
  
  // Set initial status
  connected.value = mqttService.isConnected()
})

onUnmounted(() => {
  mqttService.unsubscribe('connection', handleConnection)
  mqttService.unsubscribe('*', handleMessage)
})
</script>
