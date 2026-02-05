<template>
  <div class="space-y-8">
    <div class="space-y-2">
      <h2 class="text-4xl font-bold text-foreground tracking-tight">Vue d'ensemble</h2>
      <p class="text-lg text-muted-foreground">
        Surveillance en temps réel de toutes vos stations
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
      <router-link to="/deliveries">
        <StatsCard
          title="Livraisons ce mois"
          :value="deliveriesStore.totalDeliveriesThisMonth"
          :subtitle="`${formatVolume(deliveriesStore.totalVolumeThisMonth)}`"
          icon="Truck"
          color="purple"
          class="cursor-pointer hover:shadow-md transition-shadow"
        />
      </router-link>
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
import { useDeliveriesStore } from '@/stores/deliveries'
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
const deliveriesStore = useDeliveriesStore()

const refreshing = ref(false)
const fuelLevelsData = ref([])

// Use stations from the store (fetched from API)
const stations = computed(() => {
  return stationsStore.stations.map(station => ({
    ...station,
    location: station.location || { lat: station.latitude || 14.6937, lng: station.longitude || -17.4441 },
    tanks: (station.tanks || []).map(tank => ({
      ...tank,
      type: tank.fuelType || tank.type,
      level: tank.currentLevel || tank.level || 0,
      percentage: tank.capacity > 0 ? Math.round((tank.currentLevel || tank.level || 0) / tank.capacity * 100) : 0
    }))
  }))
})

const recentAlerts = computed(() => alertsStore.alerts.slice(0, 5))

// Extract all tanks from all stations
const tanks = computed(() => {
  return stations.value.flatMap(station => station.tanks || [])
})

const stats = computed(() => {
  const stationsList = stations.value
  const totalStations = stationsList.length
  const activeStations = stationsList.filter(s => s.status === 'online' || s.status === 'active').length

  let totalVolume = 0
  let totalCapacity = 0
  let totalPercentage = 0
  let tankCount = 0

  stationsList.forEach(station => {
    (station.tanks || []).forEach(tank => {
      totalVolume += tank.level || 0
      totalCapacity += tank.capacity || 0
      totalPercentage += tank.percentage || 0
      tankCount++
    })
  })

  const averageCapacity = tankCount > 0 ? Math.round(totalPercentage / tankCount) : 0

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

onMounted(async () => {
  // Fetch data from API
  try {
    await Promise.all([
      stationsStore.fetchStations(),
      alertsStore.fetchAlerts(),
      deliveriesStore.fetchDeliveries()
    ])
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }

  generateFuelLevelsData()

  // Update chart data every 5 seconds
  setInterval(() => {
    const lastPoint = fuelLevelsData.value[fuelLevelsData.value.length - 1]
    if (lastPoint) {
      fuelLevelsData.value.shift()
      fuelLevelsData.value.push({
        timestamp: Date.now(),
        essence: lastPoint.essence + Math.random() * 400 - 200,
        gasoil: lastPoint.gasoil + Math.random() * 300 - 150
      })
    }
  }, 5000)
})
</script>
