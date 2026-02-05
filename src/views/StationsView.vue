<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-2">
        <h2 class="text-4xl font-bold text-foreground tracking-tight">Stations</h2>
        <p class="text-lg text-muted-foreground">
          Gérez vos stations-service et leurs cuves
        </p>
      </div>
      
      <Button variant="primary" @click="showAddStationDialog = true">
        <Plus class="w-4 h-4" />
        Ajouter une station
      </Button>
    </div>

    <!-- Filters and Search -->
    <Card>
      <CardContent class="p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                placeholder="Rechercher une station..."
                class="pl-10"
              />
            </div>
          </div>
          
          <div class="flex gap-2">
            <select
              v-model="statusFilter"
              class="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="online">En ligne</option>
              <option value="warning">Alerte</option>
              <option value="offline">Hors ligne</option>
            </select>
            
            <Button variant="outline" @click="refreshStations">
              <RefreshCw :class="['w-4 h-4', refreshing && 'animate-spin']" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Stations Grid -->
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StationCard
        v-for="station in filteredStations"
        :key="station.id"
        :station="station"
        @click="navigateToStation(station.id)"
        @edit="editStation(station)"
        @delete="deleteStation(station)"
      />
    </div>

    <!-- Empty State -->
    <div v-if="filteredStations.length === 0" class="text-center py-12">
      <Building2 class="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
      <h3 class="text-lg font-semibold text-foreground mb-2">Aucune station trouvée</h3>
      <p class="text-sm text-muted-foreground mb-4">
        {{ searchQuery ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter votre première station' }}
      </p>
      <Button v-if="!searchQuery" variant="primary" @click="showAddStationDialog = true">
        <Plus class="w-4 h-4" />
        Ajouter une station
      </Button>
    </div>

    <!-- Add/Edit Station Dialog -->
    <StationDialog
      v-model:open="showAddStationDialog"
      :station="editingStation"
      @save="handleSaveStation"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStationsStore } from '@/stores/stations'
import { Plus, Search, RefreshCw, Building2 } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import StationCard from '@/components/stations/StationCard.vue'
import StationDialog from '@/components/stations/StationDialog.vue'

const router = useRouter()
const stationsStore = useStationsStore()

const searchQuery = ref('')
const statusFilter = ref('all')
const refreshing = ref(false)
const showAddStationDialog = ref(false)
const editingStation = ref(null)

// Use stations from the store (fetched from API)
const stations = computed(() => {
  return stationsStore.stations.map(station => ({
    ...station,
    location: station.location || { lat: station.latitude || 14.6937, lng: station.longitude || -17.4441 },
    manager: station.managerName || station.manager || 'Non assigné',
    phone: station.phone || '',
    tanks: (station.tanks || []).map(tank => ({
      ...tank,
      type: tank.fuelType || tank.type,
      level: tank.currentLevel || tank.level || 0,
      percentage: tank.capacity > 0 ? Math.round((tank.currentLevel || tank.level || 0) / tank.capacity * 100) : 0
    })),
    lastUpdate: station.updatedAt ? new Date(station.updatedAt) : new Date()
  }))
})

// Fetch stations on mount
onMounted(async () => {
  try {
    await stationsStore.fetchStations()
  } catch (error) {
    console.error('Failed to fetch stations:', error)
  }
})

const filteredStations = computed(() => {
  let result = stations.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(station =>
      (station.name || '').toLowerCase().includes(query) ||
      (station.address || '').toLowerCase().includes(query) ||
      (station.manager || '').toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(station => station.status === statusFilter.value)
  }

  return result
})

function navigateToStation(id) {
  router.push({ name: 'station-detail', params: { id } })
}

function editStation(station) {
  editingStation.value = { ...station }
  showAddStationDialog.value = true
}

async function deleteStation(station) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer la station "${station.name}" ?`)) {
    try {
      await stationsStore.deleteStation(station.id)
    } catch (error) {
      console.error('Failed to delete station:', error)
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }
}

async function handleSaveStation(stationData) {
  try {
    if (editingStation.value) {
      // Update existing station
      await stationsStore.updateStation(editingStation.value.id, stationData)
    } else {
      // Add new station
      await stationsStore.createStation(stationData)
    }
    showAddStationDialog.value = false
    editingStation.value = null
  } catch (error) {
    console.error('Failed to save station:', error)
    alert('Erreur lors de la sauvegarde: ' + error.message)
  }
}

async function refreshStations() {
  refreshing.value = true
  try {
    await stationsStore.fetchStations()
  } catch (error) {
    console.error('Failed to refresh stations:', error)
  } finally {
    setTimeout(() => {
      refreshing.value = false
    }, 500)
  }
}
</script>
