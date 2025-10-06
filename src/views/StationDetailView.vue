<template>
  <div v-if="station" class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-3xl font-bold text-foreground">{{ station.name }}</h2>
            <Badge :variant="statusVariant">
              {{ statusLabel }}
            </Badge>
          </div>
          <p class="text-muted-foreground mt-1">{{ station.address }}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="editStation">
          <Edit class="w-4 h-4" />
          Modifier
        </Button>
        <Button variant="primary" @click="showAddTankDialog = true">
          <Plus class="w-4 h-4" />
          Ajouter une cuve
        </Button>
      </div>
    </div>

    <!-- Station Info Cards -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
              <User class="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Responsable</p>
              <p class="text-sm font-semibold text-foreground">{{ station.manager }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
              <Phone class="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Téléphone</p>
              <p class="text-sm font-semibold text-foreground">{{ station.phone }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
              <Droplet class="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Cuves</p>
              <p class="text-sm font-semibold text-foreground">{{ station.tanks.length }} actives</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
              <Clock class="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Dernière mise à jour</p>
              <p class="text-sm font-semibold text-foreground">{{ formatTime(station.lastUpdate) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Tanks Grid -->
    <div class="grid gap-6 lg:grid-cols-2">
      <TankCard
        v-for="tank in station.tanks"
        :key="tank.id"
        :tank="tank"
        :station-name="station.name"
        @edit="editTank(tank)"
        @delete="deleteTank(tank)"
      />
    </div>

    <!-- Tank History Chart -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Historique des niveaux</CardTitle>
            <CardDescription>Évolution sur les dernières 24 heures</CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Button
              v-for="period in ['24h', '7j', '30j']"
              :key="period"
              :variant="selectedPeriod === period ? 'primary' : 'outline'"
              size="sm"
              @click="selectedPeriod = period"
            >
              {{ period }}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TankHistoryChart :tanks="station.tanks" :period="selectedPeriod" />
      </CardContent>
    </Card>

    <!-- Add/Edit Tank Dialog -->
    <TankDialog
      v-model:open="showAddTankDialog"
      :tank="editingTank"
      @save="handleSaveTank"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft,
  Edit,
  Plus,
  User,
  Phone,
  Droplet,
  Clock
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import TankCard from '@/components/stations/TankCard.vue'
import TankDialog from '@/components/stations/TankDialog.vue'
import TankHistoryChart from '@/components/stations/TankHistoryChart.vue'

const route = useRoute()
const router = useRouter()

const showAddTankDialog = ref(false)
const editingTank = ref(null)
const selectedPeriod = ref('24h')

// Mock station data (in real app, fetch from store/API)
const station = ref({
  id: parseInt(route.params.id),
  name: 'Station Total Dakar',
  address: 'Avenue Cheikh Anta Diop, Dakar',
  location: { lat: 14.6937, lng: -17.4441 },
  status: 'online',
  manager: 'Amadou Diallo',
  phone: '+221 77 123 45 67',
  tanks: [
    {
      id: 1,
      type: 'essence',
      name: 'Cuve Essence 1',
      level: 15420,
      capacity: 20000,
      percentage: 77,
      temperature: 28,
      sensorId: 'SENSOR-001',
      status: 'normal'
    },
    {
      id: 2,
      type: 'gasoil',
      name: 'Cuve Gasoil 1',
      level: 8900,
      capacity: 15000,
      percentage: 59,
      temperature: 26,
      sensorId: 'SENSOR-002',
      status: 'normal'
    }
  ],
  lastUpdate: new Date()
})

const statusConfig = {
  online: { label: 'En ligne', variant: 'success' },
  warning: { label: 'Alerte', variant: 'warning' },
  offline: { label: 'Hors ligne', variant: 'destructive' }
}

const statusLabel = computed(() => statusConfig[station.value.status]?.label || 'Inconnu')
const statusVariant = computed(() => statusConfig[station.value.status]?.variant || 'default')

function goBack() {
  router.push({ name: 'stations' })
}

function editStation() {
  // TODO: Open edit station dialog
  console.log('Edit station:', station.value)
}

function editTank(tank) {
  editingTank.value = { ...tank }
  showAddTankDialog.value = true
}

function deleteTank(tank) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer la cuve "${tank.name}" ?`)) {
    const index = station.value.tanks.findIndex(t => t.id === tank.id)
    if (index !== -1) {
      station.value.tanks.splice(index, 1)
    }
  }
}

function handleSaveTank(tankData) {
  if (editingTank.value) {
    // Update existing tank
    const index = station.value.tanks.findIndex(t => t.id === editingTank.value.id)
    if (index !== -1) {
      station.value.tanks[index] = { ...station.value.tanks[index], ...tankData }
    }
  } else {
    // Add new tank
    station.value.tanks.push({
      id: Date.now(),
      ...tankData,
      level: 0,
      percentage: 0,
      temperature: 25,
      status: 'normal'
    })
  }
  
  showAddTankDialog.value = false
  editingTank.value = null
}

function formatTime(date) {
  return format(new Date(date), 'HH:mm', { locale: fr })
}
</script>
