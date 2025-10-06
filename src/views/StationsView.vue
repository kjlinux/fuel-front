<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold text-foreground">Stations</h2>
        <p class="text-muted-foreground mt-1">
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
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
import { ref, computed } from 'vue'
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

// Mock stations data
const stations = ref([
  {
    id: 1,
    name: 'Station Total Dakar',
    address: 'Avenue Cheikh Anta Diop, Dakar',
    location: { lat: 14.6937, lng: -17.4441 },
    status: 'online',
    manager: 'Amadou Diallo',
    phone: '+221 77 123 45 67',
    tanks: [
      { id: 1, type: 'essence', level: 15420, capacity: 20000, percentage: 77, temperature: 28 },
      { id: 2, type: 'gasoil', level: 8900, capacity: 15000, percentage: 59, temperature: 26 }
    ],
    lastUpdate: new Date()
  },
  {
    id: 2,
    name: 'Station Shell Rufisque',
    address: 'Route de Rufisque, Dakar',
    location: { lat: 14.7167, lng: -17.2667 },
    status: 'online',
    manager: 'Fatou Sall',
    phone: '+221 77 234 56 78',
    tanks: [
      { id: 3, type: 'essence', level: 18200, capacity: 20000, percentage: 91, temperature: 29 },
      { id: 4, type: 'gasoil', level: 4200, capacity: 15000, percentage: 28, temperature: 27 }
    ],
    lastUpdate: new Date()
  },
  {
    id: 3,
    name: 'Station Elton Thiès',
    address: 'Avenue Lamine Gueye, Thiès',
    location: { lat: 14.7889, lng: -16.9322 },
    status: 'warning',
    manager: 'Moussa Ndiaye',
    phone: '+221 77 345 67 89',
    tanks: [
      { id: 5, type: 'essence', level: 3200, capacity: 20000, percentage: 16, temperature: 30 },
      { id: 6, type: 'gasoil', level: 12400, capacity: 15000, percentage: 83, temperature: 28 }
    ],
    lastUpdate: new Date()
  },
  {
    id: 4,
    name: 'Station Oilibya Mbour',
    address: 'Route de Mbour, Thiès',
    location: { lat: 14.4167, lng: -16.9667 },
    status: 'online',
    manager: 'Aissatou Ba',
    phone: '+221 77 456 78 90',
    tanks: [
      { id: 7, type: 'essence', level: 16800, capacity: 20000, percentage: 84, temperature: 27 },
      { id: 8, type: 'gasoil', level: 11200, capacity: 15000, percentage: 75, temperature: 26 }
    ],
    lastUpdate: new Date()
  }
])

const filteredStations = computed(() => {
  let result = stations.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(station =>
      station.name.toLowerCase().includes(query) ||
      station.address.toLowerCase().includes(query) ||
      station.manager.toLowerCase().includes(query)
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

function deleteStation(station) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer la station "${station.name}" ?`)) {
    const index = stations.value.findIndex(s => s.id === station.id)
    if (index !== -1) {
      stations.value.splice(index, 1)
    }
  }
}

function handleSaveStation(stationData) {
  if (editingStation.value) {
    // Update existing station
    const index = stations.value.findIndex(s => s.id === editingStation.value.id)
    if (index !== -1) {
      stations.value[index] = { ...stations.value[index], ...stationData }
    }
  } else {
    // Add new station
    stations.value.push({
      id: Date.now(),
      ...stationData,
      status: 'online',
      tanks: [],
      lastUpdate: new Date()
    })
  }
  
  showAddStationDialog.value = false
  editingStation.value = null
}

async function refreshStations() {
  refreshing.value = true
  await stationsStore.fetchStations()
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}
</script>
