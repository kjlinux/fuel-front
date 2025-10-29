<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="close">
    <div class="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
      <div class="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold">
          {{ isEditing ? "Modifier la livraison" : "Enregistrer une livraison" }}
        </h2>
        <Button variant="ghost" size="sm" @click="close">
          <X class="w-5 h-5" />
        </Button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Station et Cuve -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Station *</label>
            <Select
              v-model="form.stationId"
              :options="stationOptions"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Cuve *</label>
            <Select
              v-model="form.tankId"
              :options="tankOptions"
              :class="{ 'opacity-50 pointer-events-none': !form.stationId }"
            />
          </div>
        </div>

        <!-- Niveaux -->
        <div class="bg-muted/30 rounded-lg p-4 space-y-4">
          <h3 class="font-medium flex items-center gap-2">
            <Droplet class="w-5 h-5 text-primary" />
            Informations sur les niveaux
          </h3>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Niveau avant (L) *</label>
              <Input
                v-model.number="form.levelBefore"
                type="number"
                min="0"
                required
                placeholder="ex: 2000"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Quantité livrée (L) *</label>
              <Input
                v-model.number="form.quantityDelivered"
                type="number"
                min="1"
                required
                placeholder="ex: 18000"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Niveau après (L) *</label>
              <Input
                v-model.number="levelAfterCalculated"
                type="number"
                disabled
                class="bg-muted"
              />
            </div>
          </div>

          <div class="text-sm text-muted-foreground bg-info/10 rounded p-3 border border-info/20">
            <div class="flex items-start gap-2">
              <Info class="w-4 h-4 mt-0.5 text-info" />
              <div>
                Le niveau après est calculé automatiquement: <strong>{{ levelAfterCalculated }} L</strong>
                <br />
                Capacité disponible: <strong>{{ remainingCapacity }} L</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Informations livraison -->
        <div class="space-y-4">
          <h3 class="font-medium flex items-center gap-2">
            <Truck class="w-5 h-5 text-primary" />
            Informations sur la livraison
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Date et heure *</label>
              <Input
                v-model="form.deliveryDate"
                type="datetime-local"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">N° Commande *</label>
              <Input
                v-model="form.orderNumber"
                type="text"
                required
                placeholder="ex: CMD-2025-001"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Transporteur *</label>
              <Input
                v-model="form.deliveredBy"
                type="text"
                required
                placeholder="ex: Transport Pétrolier SA"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Chauffeur *</label>
              <Input
                v-model="form.driverName"
                type="text"
                required
                placeholder="ex: Jean Dupont"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">N° Camion *</label>
              <Input
                v-model="form.truckNumber"
                type="text"
                required
                placeholder="ex: AB-123-CD"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Température (°C)</label>
              <Input
                v-model.number="form.temperature"
                type="number"
                step="0.1"
                placeholder="ex: 20"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Notes</label>
            <textarea
              v-model="form.notes"
              class="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
              rows="3"
              placeholder="Commentaires sur la livraison..."
            ></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="close">
            Annuler
          </Button>
          <Button type="submit" :disabled="!isFormValid">
            <Save class="w-4 h-4 mr-2" />
            {{ isEditing ? "Mettre à jour" : "Enregistrer" }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import Button from "@/components/ui/Button.vue"
import Input from "@/components/ui/Input.vue"
import Select from "@/components/ui/Select.vue"
import { X, Droplet, Truck, Save, Info } from "lucide-vue-next"
import { useStationsStore } from "@/stores/stations"

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  delivery: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["close", "submit"])

const stationsStore = useStationsStore()
const stations = computed(() => stationsStore.stations)

const isEditing = computed(() => !!props.delivery)

const form = ref({
  stationId: "",
  tankId: "",
  levelBefore: 0,
  quantityDelivered: 0,
  deliveryDate: new Date().toISOString().slice(0, 16),
  orderNumber: "",
  deliveredBy: "",
  driverName: "",
  truckNumber: "",
  temperature: 20,
  notes: "",
})

// Réinitialiser le formulaire quand on ouvre/ferme
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      if (props.delivery) {
        // Mode édition
        form.value = {
          ...props.delivery,
          deliveryDate: new Date(props.delivery.deliveryDate).toISOString().slice(0, 16),
        }
      } else {
        // Mode création - réinitialiser
        form.value = {
          stationId: "",
          tankId: "",
          levelBefore: 0,
          quantityDelivered: 0,
          deliveryDate: new Date().toISOString().slice(0, 16),
          orderNumber: "",
          deliveredBy: "",
          driverName: "",
          truckNumber: "",
          temperature: 20,
          notes: "",
        }
      }
    }
  }
)

const selectedStation = computed(() => {
  return stations.value.find((s) => s.id === Number(form.value.stationId))
})

const availableTanks = computed(() => {
  return selectedStation.value?.tanks || []
})

const selectedTank = computed(() => {
  return availableTanks.value.find((t) => t.id === Number(form.value.tankId))
})

// Options pour les selects
const stationOptions = computed(() => [
  { value: "", label: "Sélectionner une station" },
  ...stations.value.map((station) => ({
    value: station.id,
    label: station.name,
  })),
])

const tankOptions = computed(() => [
  { value: "", label: "Sélectionner une cuve" },
  ...availableTanks.value.map((tank) => ({
    value: tank.id,
    label: `${tank.name} - ${tank.fuelType}`,
  })),
])

// Calculer le niveau après automatiquement
const levelAfterCalculated = computed(() => {
  return form.value.levelBefore + form.value.quantityDelivered
})

const remainingCapacity = computed(() => {
  if (!selectedTank.value) return 0
  return selectedTank.value.capacity - levelAfterCalculated.value
})

const isFormValid = computed(() => {
  return (
    form.value.stationId &&
    form.value.tankId &&
    form.value.levelBefore >= 0 &&
    form.value.quantityDelivered > 0 &&
    form.value.orderNumber &&
    form.value.deliveredBy &&
    form.value.driverName &&
    form.value.truckNumber &&
    levelAfterCalculated.value <= (selectedTank.value?.capacity || Infinity)
  )
})

// Mettre à jour l'ID de cuve quand on change de station
watch(
  () => form.value.stationId,
  () => {
    form.value.tankId = ""
  }
)

function close() {
  emit("close")
}

function handleSubmit() {
  if (!isFormValid.value) return

  const deliveryData = {
    ...form.value,
    stationId: Number(form.value.stationId),
    tankId: Number(form.value.tankId),
    stationName: selectedStation.value?.name,
    tankName: selectedTank.value?.name,
    fuelType: selectedTank.value?.fuelType,
    levelAfter: levelAfterCalculated.value,
    deliveryDate: new Date(form.value.deliveryDate),
  }

  emit("submit", deliveryData)
  close()
}
</script>
