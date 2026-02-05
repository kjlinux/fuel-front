<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>

  <!-- Station not found -->
  <div v-else-if="!station" class="text-center py-12">
    <h3 class="text-lg font-semibold text-foreground mb-2">Station non trouvée</h3>
    <p class="text-sm text-muted-foreground mb-4">Cette station n'existe pas ou a été supprimée</p>
    <Button variant="outline" @click="goBack">
      <ArrowLeft class="w-4 h-4" />
      Retour aux stations
    </Button>
  </div>

  <!-- Station details -->
  <div v-else class="space-y-6">
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStationsStore } from '@/stores/stations'
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
const stationsStore = useStationsStore()

const showAddTankDialog = ref(false)
const editingTank = ref(null)
const selectedPeriod = ref('24h')
const loading = ref(true)

// Get station from store with transformed data
const station = computed(() => {
  const storeStation = stationsStore.stations.find(s => s.id === route.params.id)
  if (!storeStation) return null

  return {
    ...storeStation,
    location: storeStation.location || { lat: storeStation.latitude || 14.6937, lng: storeStation.longitude || -17.4441 },
    manager: storeStation.managerName || storeStation.manager || 'Non assigné',
    phone: storeStation.phone || '',
    tanks: (storeStation.tanks || []).map(tank => ({
      ...tank,
      type: tank.fuelType || tank.type,
      name: tank.name || `Cuve ${tank.fuelType || tank.type}`,
      level: tank.currentLevel || tank.level || 0,
      percentage: tank.capacity > 0 ? Math.round((tank.currentLevel || tank.level || 0) / tank.capacity * 100) : 0,
      temperature: tank.temperature || 25,
      status: tank.status || 'normal'
    })),
    lastUpdate: storeStation.updatedAt ? new Date(storeStation.updatedAt) : new Date()
  }
})

// Fetch station data on mount
onMounted(async () => {
  try {
    // Fetch stations if not already loaded
    if (stationsStore.stations.length === 0) {
      await stationsStore.fetchStations()
    }
    // Also fetch the specific station to get latest data
    await stationsStore.fetchStation(route.params.id)
  } catch (error) {
    console.error('Failed to fetch station:', error)
  } finally {
    loading.value = false
  }
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

async function deleteTank(tank) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer la cuve "${tank.name}" ?`)) {
    try {
      await stationsStore.deleteTank(tank.id)
    } catch (error) {
      console.error('Failed to delete tank:', error)
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }
}

async function handleSaveTank(tankData) {
  try {
    if (editingTank.value) {
      // Update existing tank
      await stationsStore.updateTank(editingTank.value.id, tankData)
    } else {
      // Add new tank
      await stationsStore.createTank(route.params.id, {
        ...tankData,
        currentLevel: 0,
        temperature: 25
      })
    }
    showAddTankDialog.value = false
    editingTank.value = null
  } catch (error) {
    console.error('Failed to save tank:', error)
    alert('Erreur lors de la sauvegarde: ' + error.message)
  }
}

function formatTime(date) {
  if (!date) return '--:--'
  return format(new Date(date), 'HH:mm', { locale: fr })
}
</script>
