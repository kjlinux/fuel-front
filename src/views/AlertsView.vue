<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-2">
        <h2 class="text-4xl font-bold text-foreground tracking-tight">Alertes</h2>
        <p class="text-lg text-muted-foreground">
          Gérez et surveillez toutes les alertes du système
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Badge variant="destructive" class="text-base px-3 py-1">
          {{ criticalCount }} critiques
        </Badge>
        <Badge variant="warning" class="text-base px-3 py-1">
          {{ warningCount }} alertes
        </Badge>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total actives</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ activeAlerts.length }}</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Bell class="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Critiques</p>
              <p class="text-2xl font-bold text-destructive mt-1">{{ criticalCount }}</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10">
              <AlertTriangle class="w-6 h-6 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Résolues aujourd'hui</p>
              <p class="text-2xl font-bold text-success mt-1">{{ resolvedTodayCount }}</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <CheckCircle class="w-6 h-6 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Temps moyen</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ averageResolutionTime }}</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
              <Clock class="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                placeholder="Rechercher une alerte..."
                class="pl-10"
              />
            </div>
          </div>
          
          <div class="flex gap-2 flex-wrap">
            <select
              v-model="severityFilter"
              class="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Toutes les sévérités</option>
              <option value="critical">Critique</option>
              <option value="warning">Attention</option>
              <option value="info">Info</option>
            </select>
            
            <select
              v-model="typeFilter"
              class="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tous les types</option>
              <option value="low_level">Niveau bas</option>
              <option value="anomaly">Anomalie</option>
              <option value="disconnected">Déconnexion</option>
              <option value="temperature">Température</option>
            </select>
            
            <select
              v-model="statusFilter"
              class="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="active">Actives</option>
              <option value="resolved">Résolues</option>
              <option value="all">Toutes</option>
            </select>
            
            <Button variant="outline" @click="refreshAlerts">
              <RefreshCw :class="['w-4 h-4', refreshing && 'animate-spin']" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Alerts List -->
    <div class="space-y-3">
      <AlertCard
        v-for="alert in filteredAlerts"
        :key="alert.id"
        :alert="alert"
        @resolve="resolveAlert(alert)"
        @view-details="viewAlertDetails(alert)"
      />
    </div>

    <!-- Empty State -->
    <div v-if="filteredAlerts.length === 0" class="text-center py-12">
      <CheckCircle class="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-foreground mb-2">Aucune alerte</h3>
      <p class="text-sm text-muted-foreground">
        {{ statusFilter === 'active' ? 'Toutes les alertes ont été résolues' : 'Aucune alerte ne correspond à vos critères' }}
      </p>
    </div>

    <!-- Alert Details Dialog -->
    <AlertDetailsDialog
      v-model:open="showDetailsDialog"
      :alert="selectedAlert"
      @resolve="resolveAlert"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAlertsStore } from '@/stores/alerts'
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  RefreshCw
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import AlertCard from '@/components/alerts/AlertCard.vue'
import AlertDetailsDialog from '@/components/alerts/AlertDetailsDialog.vue'

const alertsStore = useAlertsStore()

const searchQuery = ref('')
const severityFilter = ref('all')
const typeFilter = ref('all')
const statusFilter = ref('active')
const refreshing = ref(false)
const showDetailsDialog = ref(false)
const selectedAlert = ref(null)

const activeAlerts = computed(() => alertsStore.alerts.filter(a => !a.resolved))
const criticalCount = computed(() => activeAlerts.value.filter(a => a.severity === 'critical').length)
const warningCount = computed(() => activeAlerts.value.filter(a => a.severity === 'warning').length)
const resolvedTodayCount = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0)
  return alertsStore.alerts.filter(a => 
    a.resolved && a.resolvedAt && new Date(a.resolvedAt).setHours(0, 0, 0, 0) === today
  ).length
})
const averageResolutionTime = computed(() => '2h 15m')

const filteredAlerts = computed(() => {
  let result = alertsStore.alerts

  // Filter by status
  if (statusFilter.value === 'active') {
    result = result.filter(a => !a.resolved)
  } else if (statusFilter.value === 'resolved') {
    result = result.filter(a => a.resolved)
  }

  // Filter by severity
  if (severityFilter.value !== 'all') {
    result = result.filter(a => a.severity === severityFilter.value)
  }

  // Filter by type
  if (typeFilter.value !== 'all') {
    result = result.filter(a => a.type === typeFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(a =>
      a.message.toLowerCase().includes(query) ||
      a.type.toLowerCase().includes(query)
    )
  }

  return result
})

function resolveAlert(alert) {
  alertsStore.resolveAlert(alert.id)
  showDetailsDialog.value = false
}

function viewAlertDetails(alert) {
  selectedAlert.value = alert
  showDetailsDialog.value = true
}

async function refreshAlerts() {
  refreshing.value = true
  await alertsStore.fetchAlerts()
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}
</script>
