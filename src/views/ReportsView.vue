<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold text-foreground">Rapports & Statistiques</h2>
        <p class="text-muted-foreground mt-1">
          Analysez les performances et la consommation de vos stations
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="exportToPDF">
          <FileText class="w-4 h-4 mr-2" />
        </Button>
        <Button variant="outline" @click="exportToExcel">
          <Download class="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>

    <Card>
      <CardContent class="p-4">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1 grid gap-4 md:grid-cols-3">
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground">Période</label>
              <select
                v-model="selectedPeriod"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>
            
            <div v-if="selectedPeriod === 'custom'" class="space-y-2">
              <label class="text-sm font-medium text-foreground">Date début</label>
              <Input type="date" v-model="customStartDate" />
            </div>
            
            <div v-if="selectedPeriod === 'custom'" class="space-y-2">
              <label class="text-sm font-medium text-foreground">Date fin</label>
              <Input type="date" v-model="customEndDate" />
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground">Station</label>
              <select
                v-model="selectedStation"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Toutes les stations</option>
                <option value="1">Station Total Dakar</option>
                <option value="2">Station Shell Rufisque</option>
                <option value="3">Station Elton Thiès</option>
                <option value="4">Station Oilibya Mbour</option>
              </select>
            </div>
          </div>
          
          <Button variant="primary" @click="generateReport">
            <BarChart3 class="w-4 h-4 mr-2" />
            Générer
          </Button>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Volume total vendu</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ formatVolume(metrics.totalSold) }} L</p>
              <p class="text-xs text-success mt-1">+12.5% vs période précédente</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <TrendingUp class="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Revenus estimés</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ formatCurrency(metrics.revenue) }}</p>
              <p class="text-xs text-success mt-1">+8.3% vs période précédente</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <DollarSign class="w-6 h-6 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Consommation moyenne</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ metrics.avgConsumption }} L/j</p>
              <p class="text-xs text-muted-foreground mt-1">Par station</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
              <Activity class="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Taux de rotation</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ metrics.rotationRate }}%</p>
              <p class="text-xs text-success mt-1">Optimal</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
              <RefreshCw class="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Évolution de la consommation</CardTitle>
          <CardDescription>Volume vendu par jour</CardDescription>
        </CardHeader>
        <CardContent>
          <ConsumptionTrendChart :data="consumptionData" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition par type</CardTitle>
          <CardDescription>Distribution essence vs gasoil</CardDescription>
        </CardHeader>
        <CardContent>
          <FuelTypeChart :data="fuelTypeData" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparaison des stations</CardTitle>
          <CardDescription>Volume vendu par station</CardDescription>
        </CardHeader>
        <CardContent>
          <StationComparisonChart :data="stationComparisonData" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Heures de pointe</CardTitle>
          <CardDescription>Consommation par heure de la journée</CardDescription>
        </CardHeader>
        <CardContent>
          <PeakHoursChart :data="peakHoursData" />
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Détails par station</CardTitle>
            <CardDescription>Statistiques détaillées de performance</CardDescription>
          </div>
          <Button variant="outline" size="sm" @click="exportTableToCSV">
            <Download class="w-4 h-4 mr-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <StationPerformanceTable :data="stationPerformanceData" />
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import ConsumptionTrendChart from '@/components/reports/ConsumptionTrendChart.vue'
import FuelTypeChart from '@/components/reports/FuelTypeChart.vue'
import StationComparisonChart from '@/components/reports/StationComparisonChart.vue'
import PeakHoursChart from '@/components/reports/PeakHoursChart.vue'
import StationPerformanceTable from '@/components/reports/StationPerformanceTable.vue'

const selectedPeriod = ref('month')
const selectedStation = ref('all')
const customStartDate = ref('')
const customEndDate = ref('')

// Mock metrics data
const metrics = ref({
  totalSold: 245680,
  revenue: 184260000,
  avgConsumption: 8189,
  rotationRate: 87
})

// Mock chart data
const consumptionData = ref(generateConsumptionData())
const fuelTypeData = ref([
  { name: 'Essence', value: 145680, color: '#3b82f6' },
  { name: 'Gasoil', value: 100000, color: '#f59e0b' }
])
const stationComparisonData = ref([
  { name: 'Total Dakar', essence: 45000, gasoil: 32000 },
  { name: 'Shell Rufisque', essence: 38000, gasoil: 28000 },
  { name: 'Elton Thiès', essence: 35000, gasoil: 22000 },
  { name: 'Oilibya Mbour', essence: 27680, gasoil: 18000 }
])
const peakHoursData = ref(generatePeakHoursData())
const stationPerformanceData = ref([
  {
    station: 'Station Total Dakar',
    totalVolume: 77000,
    revenue: 57750000,
    avgDaily: 2567,
    alerts: 3,
    uptime: 99.8
  },
  {
    station: 'Station Shell Rufisque',
    totalVolume: 66000,
    revenue: 49500000,
    avgDaily: 2200,
    alerts: 5,
    uptime: 98.5
  },
  {
    station: 'Station Elton Thiès',
    totalVolume: 57000,
    revenue: 42750000,
    avgDaily: 1900,
    alerts: 8,
    uptime: 96.2
  },
  {
    station: 'Station Oilibya Mbour',
    totalVolume: 45680,
    revenue: 34260000,
    avgDaily: 1523,
    alerts: 4,
    uptime: 99.1
  }
])

function generateConsumptionData() {
  const data = []
  const days = 30
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      essence: 4000 + Math.random() * 2000,
      gasoil: 3000 + Math.random() * 1500
    })
  }
  
  return data
}

function generatePeakHoursData() {
  const hours = []
  
  for (let i = 0; i < 24; i++) {
    const baseVolume = i >= 6 && i <= 20 ? 500 : 100
    const peakMultiplier = (i >= 7 && i <= 9) || (i >= 17 && i <= 19) ? 2 : 1
    
    hours.push({
      hour: `${i.toString().padStart(2, '0')}h`,
      volume: baseVolume * peakMultiplier + Math.random() * 200
    })
  }
  
  return hours
}

function formatVolume(volume) {
  return new Intl.NumberFormat('fr-FR').format(volume)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

function generateReport() {
  console.log('Generating report for:', {
    period: selectedPeriod.value,
    station: selectedStation.value,
    customDates: selectedPeriod.value === 'custom' ? {
      start: customStartDate.value,
      end: customEndDate.value
    } : null
  })
}

function exportToPDF() {
  console.log('Exporting to PDF...')
  // In real app, generate PDF using library like jsPDF
}

function exportToExcel() {
  console.log('Exporting to Excel...')
  // In real app, generate Excel using library like xlsx
}

function exportTableToCSV() {
  console.log('Exporting table to CSV...')
  // In real app, convert table data to CSV
}
</script>
