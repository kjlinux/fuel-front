<template>
  <div class="space-y-8">
    <div class="space-y-2">
      <h2 class="text-4xl font-bold text-foreground tracking-tight">Vue d'ensemble</h2>
      <p class="text-lg text-muted-foreground">
        Surveillance en temps réel de toutes vos stations
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Stations actives"
        :value="stats.activeStations"
        :total="stats.totalStations"
        icon="Building2"
        color="blue"
      />
      <StatsCard
        title="Volume total"
        :value="formatVolume(stats.totalVolume)"
        subtitle="litres"
        icon="Droplet"
        color="cyan"
      />
      <StatsCard
        title="Capacité moyenne"
        :value="`${stats.averageCapacity}%`"
        :trend="stats.capacityTrend"
        icon="Gauge"
        color="green"
      />
      <StatsCard
        title="Alertes actives"
        :value="stats.activeAlerts"
        :critical="stats.criticalAlerts"
        icon="AlertTriangle"
        color="orange"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Niveaux de carburant</CardTitle>
              <CardDescription>Évolution en temps réel</CardDescription>
            </div>
            <Badge variant="success" class="gap-1">
              <Activity class="w-3 h-3" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <FuelLevelsChart :data="fuelLevelsData" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition des stations</CardTitle>
          <CardDescription>{{ stats.totalStations }} stations surveillées</CardDescription>
        </CardHeader>
        <CardContent>
          <StationsMap :stations="stations" />
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Stations</CardTitle>
            <CardDescription>État actuel de vos stations</CardDescription>
          </div>
          <Button variant="outline" size="sm" @click="refreshStations">
            <RefreshCw :class="['w-4 h-4', refreshing && 'animate-spin']" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <StationsList :tanks="tanks" :stations="stations" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Alertes récentes</CardTitle>
            <CardDescription>Dernières 5 alertes</CardDescription>
          </div>
          <router-link to="/alerts">
            <Button variant="ghost" size="sm">
              Voir tout
              <ChevronRight class="w-4 h-4 ml-1" />
            </Button>
          </router-link>
        </div>
      </CardHeader>
      <CardContent>
        <RecentAlerts :alerts="recentAlerts" :limit="5" />
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStationsStore } from '@/stores/stations'
import { useAlertsStore } from '@/stores/alerts'
import {
  Building2,
  Droplet,
  Gauge,
  AlertTriangle,
  Activity,
  RefreshCw,
  ChevronRight
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import FuelLevelsChart from '@/components/dashboard/FuelLevelsChart.vue'
import StationsMap from '@/components/dashboard/StationsMap.vue'
import StationsList from '@/components/dashboard/StationsList.vue'
import RecentAlerts from '@/components/dashboard/RecentAlerts.vue'

const stationsStore = useStationsStore()
const alertsStore = useAlertsStore()

const refreshing = ref(false)
const fuelLevelsData = ref([])

// Mock data for demonstration
const stations = ref([
  {
    id: 1,
    name: 'Station Total Dakar',
    location: { lat: 14.6937, lng: -17.4441 },
    status: 'online',
    tanks: [
      { id: 1, type: 'essence', level: 15420, capacity: 20000, percentage: 77 },
      { id: 2, type: 'gasoil', level: 8900, capacity: 15000, percentage: 59 }
    ]
  },
  {
    id: 2,
    name: 'Station Shell Rufisque',
    location: { lat: 14.7167, lng: -17.2667 },
    status: 'online',
    tanks: [
      { id: 3, type: 'essence', level: 18200, capacity: 20000, percentage: 91 },
      { id: 4, type: 'gasoil', level: 4200, capacity: 15000, percentage: 28 }
    ]
  },
  {
    id: 3,
    name: 'Station Elton Thiès',
    location: { lat: 14.7889, lng: -16.9322 },
    status: 'warning',
    tanks: [
      { id: 5, type: 'essence', level: 3200, capacity: 20000, percentage: 16 },
      { id: 6, type: 'gasoil', level: 12400, capacity: 15000, percentage: 83 }
    ]
  },
  {
    id: 4,
    name: 'Station Oilibya Mbour',
    location: { lat: 14.4167, lng: -16.9667 },
    status: 'online',
    tanks: [
      { id: 7, type: 'essence', level: 16800, capacity: 20000, percentage: 84 },
      { id: 8, type: 'gasoil', level: 11200, capacity: 15000, percentage: 75 }
    ]
  }
])

const recentAlerts = computed(() => alertsStore.alerts.slice(0, 5))

const stats = computed(() => {
  const totalStations = stations.value.length
  const activeStations = stations.value.filter(s => s.status === 'online').length
  
  let totalVolume = 0
  let totalCapacity = 0
  let totalPercentage = 0
  
  stations.value.forEach(station => {
    station.tanks.forEach(tank => {
      totalVolume += tank.level
      totalCapacity += tank.capacity
      totalPercentage += tank.percentage
    })
  })
  
  const tankCount = stations.value.reduce((acc, s) => acc + s.tanks.length, 0)
  const averageCapacity = Math.round(totalPercentage / tankCount)
  
  const activeAlerts = alertsStore.alerts.filter(a => !a.resolved).length
  const criticalAlerts = alertsStore.alerts.filter(a => !a.resolved && a.severity === 'critical').length
  
  return {
    totalStations,
    activeStations,
    totalVolume,
    averageCapacity,
    capacityTrend: averageCapacity > 70 ? 'up' : averageCapacity < 30 ? 'down' : 'stable',
    activeAlerts,
    criticalAlerts
  }
})

function formatVolume(volume) {
  return new Intl.NumberFormat('fr-FR').format(volume)
}

async function refreshStations() {
  refreshing.value = true
  await stationsStore.fetchStations()
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

// Generate mock real-time data
function generateFuelLevelsData() {
  const now = Date.now()
  const data = []
  
  for (let i = 30; i >= 0; i--) {
    const timestamp = now - i * 60000 // 30 minutes of data
    data.push({
      timestamp,
      essence: 53000 + Math.random() * 2000 - 1000,
      gasoil: 36700 + Math.random() * 1500 - 750
    })
  }
  
  fuelLevelsData.value = data
}

onMounted(() => {
  generateFuelLevelsData()
  
  // Update data every 5 seconds
  setInterval(() => {
    const lastPoint = fuelLevelsData.value[fuelLevelsData.value.length - 1]
    fuelLevelsData.value.shift()
    fuelLevelsData.value.push({
      timestamp: Date.now(),
      essence: lastPoint.essence + Math.random() * 400 - 200,
      gasoil: lastPoint.gasoil + Math.random() * 300 - 150
    })
  }, 5000)
  
  // Add some mock alerts
  if (alertsStore.alerts.length === 0) {
    alertsStore.addAlert({
      type: 'low_level',
      severity: 'warning',
      stationId: 3,
      tankId: 5,
      message: 'Niveau bas détecté - Essence (16%)'
    })
    
    alertsStore.addAlert({
      type: 'anomaly',
      severity: 'critical',
      stationId: 2,
      tankId: 4,
      message: 'Baisse anormale détectée - Possible fuite'
    })
  }
})
</script>
