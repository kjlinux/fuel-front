<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Suivi des Dépotages</h1>
        <p class="text-muted-foreground mt-1">
          Gérez et suivez toutes les livraisons de carburant
        </p>
      </div>
      <Button @click="openNewDeliveryDialog">
        <Plus class="w-4 h-4 mr-2" />
        Nouvelle livraison
      </Button>
    </div>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total ce mois</p>
              <p class="text-2xl font-bold">{{ deliveriesStore.totalDeliveriesThisMonth }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck class="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Volume ce mois</p>
              <p class="text-2xl font-bold">{{ formatVolume(deliveriesStore.totalVolumeThisMonth) }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <Droplet class="w-6 h-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Volume moyen</p>
              <p class="text-2xl font-bold">{{ formatVolume(deliveriesStore.averageDeliveryVolume) }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
              <TrendingUp class="w-6 h-6 text-info" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">En attente</p>
              <p class="text-2xl font-bold">{{ deliveriesStore.pendingDeliveries.length }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertCircle class="w-6 h-6 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filtres -->
    <Card>
      <CardContent class="pt-6">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher (commande, chauffeur, transporteur...)"
            >
              <template #prefix>
                <Search class="w-4 h-4 text-muted-foreground" />
              </template>
            </Input>
          </div>

          <Select
            v-model="filterStation"
            :options="stationOptions"
            class="w-[200px]"
          />

          <Select
            v-model="filterFuelType"
            :options="fuelTypeOptions"
            class="w-[150px]"
          />

          <Select
            v-model="filterValidation"
            :options="validationOptions"
            class="w-[150px]"
          />

          <Button variant="outline" @click="resetFilters">
            <X class="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Liste des livraisons -->
    <div v-if="filteredDeliveries.length === 0" class="text-center py-12">
      <Package class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium mb-2">Aucune livraison trouvée</h3>
      <p class="text-muted-foreground mb-4">
        {{ searchQuery || filterStation || filterFuelType || filterValidation
          ? "Essayez de modifier vos filtres"
          : "Commencez par enregistrer une nouvelle livraison"
        }}
      </p>
      <Button @click="openNewDeliveryDialog">
        <Plus class="w-4 h-4 mr-2" />
        Nouvelle livraison
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <DeliveryCard
        v-for="delivery in filteredDeliveries"
        :key="delivery.id"
        :delivery="delivery"
        @validate="handleValidate"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Dialog -->
    <DeliveryDialog
      :is-open="isDialogOpen"
      :delivery="selectedDelivery"
      @close="closeDialog"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import Card from "@/components/ui/Card.vue"
import CardContent from "@/components/ui/CardContent.vue"
import Button from "@/components/ui/Button.vue"
import Input from "@/components/ui/Input.vue"
import Select from "@/components/ui/Select.vue"
import DeliveryCard from "@/components/deliveries/DeliveryCard.vue"
import DeliveryDialog from "@/components/deliveries/DeliveryDialog.vue"
import {
  Plus,
  Truck,
  Droplet,
  TrendingUp,
  AlertCircle,
  Search,
  X,
  Package,
} from "lucide-vue-next"
import { useDeliveriesStore } from "@/stores/deliveries"
import { useStationsStore } from "@/stores/stations"
import { useAuthStore } from "@/stores/auth"

const deliveriesStore = useDeliveriesStore()
const stationsStore = useStationsStore()
const authStore = useAuthStore()

const stations = computed(() => stationsStore.stations)

// Filtres
const searchQuery = ref("")
const filterStation = ref("")
const filterFuelType = ref("")
const filterValidation = ref("")

// Dialog
const isDialogOpen = ref(false)
const selectedDelivery = ref(null)

onMounted(() => {
  deliveriesStore.fetchDeliveries()
  stationsStore.fetchStations()
})

// Options pour les selects
const stationOptions = computed(() => [
  { value: "", label: "Toutes les stations" },
  ...stations.value.map((station) => ({
    value: station.id,
    label: station.name,
  })),
])

const fuelTypeOptions = [
  { value: "", label: "Tous les types" },
  { value: "essence", label: "Essence" },
  { value: "gasoil", label: "Gasoil" },
]

const validationOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "validated", label: "Validés" },
  { value: "pending", label: "En attente" },
]

const filteredDeliveries = computed(() => {
  let result = [...deliveriesStore.deliveries]

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (d) =>
        d.orderNumber.toLowerCase().includes(query) ||
        d.driverName.toLowerCase().includes(query) ||
        d.deliveredBy.toLowerCase().includes(query) ||
        d.truckNumber.toLowerCase().includes(query) ||
        d.stationName.toLowerCase().includes(query) ||
        d.tankName.toLowerCase().includes(query)
    )
  }

  // Filtre par station
  if (filterStation.value) {
    result = result.filter((d) => d.stationId === Number(filterStation.value))
  }

  // Filtre par type de carburant
  if (filterFuelType.value) {
    result = result.filter((d) => d.fuelType === filterFuelType.value)
  }

  // Filtre par statut de validation
  if (filterValidation.value === "validated") {
    result = result.filter((d) => d.validated)
  } else if (filterValidation.value === "pending") {
    result = result.filter((d) => !d.validated)
  }

  return result
})

function formatVolume(volume) {
  return new Intl.NumberFormat("fr-FR").format(volume) + " L"
}

function resetFilters() {
  searchQuery.value = ""
  filterStation.value = ""
  filterFuelType.value = ""
  filterValidation.value = ""
}

function openNewDeliveryDialog() {
  selectedDelivery.value = null
  isDialogOpen.value = true
}

function closeDialog() {
  isDialogOpen.value = false
  selectedDelivery.value = null
}

function handleSubmit(deliveryData) {
  if (selectedDelivery.value) {
    // Mise à jour
    deliveriesStore.updateDelivery(selectedDelivery.value.id, deliveryData)
  } else {
    // Création
    deliveriesStore.addDelivery(deliveryData)
  }
}

function handleValidate(deliveryId) {
  const userName = authStore.user?.name || "Admin User"
  deliveriesStore.validateDelivery(deliveryId, userName)
}

function handleEdit(delivery) {
  selectedDelivery.value = delivery
  isDialogOpen.value = true
}

function handleDelete(deliveryId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette livraison ?")) {
    deliveriesStore.deleteDelivery(deliveryId)
  }
}
</script>
