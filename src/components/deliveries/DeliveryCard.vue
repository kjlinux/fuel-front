<template>
  <Card class="hover:shadow-lg transition-shadow">
    <CardHeader>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <Truck class="w-5 h-5 text-primary" />
            <CardTitle class="text-lg">{{ delivery.orderNumber }}</CardTitle>
            <Badge :variant="delivery.validated ? 'default' : 'outline'" class="ml-2">
              {{ delivery.validated ? "Validé" : "En attente" }}
            </Badge>
          </div>
          <CardDescription>
            {{ formatDate(delivery.deliveryDate) }}
          </CardDescription>
        </div>
        <div class="flex gap-2">
          <Button v-if="!delivery.validated" size="sm" variant="outline" @click="$emit('validate', delivery.id)">
            <CheckCircle class="w-4 h-4 mr-1" />
            Valider
          </Button>
          <Button size="sm" variant="ghost" @click="$emit('edit', delivery)">
            <Edit class="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" @click="$emit('delete', delivery.id)">
            <Trash2 class="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Station et Cuve -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-muted-foreground mb-1">Station</div>
          <div class="font-medium">{{ delivery.stationName }}</div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground mb-1">Cuve</div>
          <div class="flex items-center gap-2">
            <Badge :variant="fuelTypeVariant(delivery.fuelType)">
              {{ delivery.fuelType }}
            </Badge>
            <span class="font-medium">{{ delivery.tankName }}</span>
          </div>
        </div>
      </div>

      <!-- Niveaux -->
      <div class="bg-muted/50 rounded-lg p-4">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-muted-foreground">
              {{ formatVolume(delivery.levelBefore) }}
            </div>
            <div class="text-xs text-muted-foreground mt-1">Niveau avant</div>
          </div>
          <div class="flex items-center justify-center">
            <ArrowRight class="w-8 h-8 text-primary" />
            <div class="ml-2">
              <div class="text-3xl font-bold text-primary">
                +{{ formatVolume(delivery.quantityDelivered) }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">Livré</div>
            </div>
          </div>
          <div>
            <div class="text-2xl font-bold text-success">
              {{ formatVolume(delivery.levelAfter) }}
            </div>
            <div class="text-xs text-muted-foreground mt-1">Niveau après</div>
          </div>
        </div>
      </div>

      <!-- Informations livraison -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="flex items-center gap-2">
          <Building2 class="w-4 h-4 text-muted-foreground" />
          <span class="text-muted-foreground">Transporteur:</span>
          <span class="font-medium">{{ delivery.deliveredBy }}</span>
        </div>
        <div class="flex items-center gap-2">
          <User class="w-4 h-4 text-muted-foreground" />
          <span class="text-muted-foreground">Chauffeur:</span>
          <span class="font-medium">{{ delivery.driverName }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Truck class="w-4 h-4 text-muted-foreground" />
          <span class="text-muted-foreground">Camion:</span>
          <span class="font-medium">{{ delivery.truckNumber }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Thermometer class="w-4 h-4 text-muted-foreground" />
          <span class="text-muted-foreground">Température:</span>
          <span class="font-medium">{{ delivery.temperature }}°C</span>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="delivery.notes" class="text-sm bg-accent/10 rounded p-3 border border-accent/20">
        <div class="font-medium text-accent-foreground mb-1">Notes:</div>
        <div class="text-muted-foreground">{{ delivery.notes }}</div>
      </div>

      <!-- Validation -->
      <div v-if="delivery.validated" class="flex items-center gap-2 text-sm text-success pt-2 border-t">
        <CheckCircle class="w-4 h-4" />
        <span>Validé par {{ delivery.validatedBy }} le {{ formatDate(delivery.validatedAt) }}</span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import Card from "@/components/ui/Card.vue"
import CardContent from "@/components/ui/CardContent.vue"
import CardDescription from "@/components/ui/CardDescription.vue"
import CardHeader from "@/components/ui/CardHeader.vue"
import CardTitle from "@/components/ui/CardTitle.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import {
  Truck,
  CheckCircle,
  Edit,
  Trash2,
  ArrowRight,
  Building2,
  User,
  Thermometer,
} from "lucide-vue-next"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

defineProps({
  delivery: {
    type: Object,
    required: true,
  },
})

defineEmits(["validate", "edit", "delete"])

function formatDate(date) {
  return format(new Date(date), "dd MMM yyyy 'à' HH:mm", { locale: fr })
}

function formatVolume(volume) {
  return new Intl.NumberFormat("fr-FR").format(volume) + " L"
}

function fuelTypeVariant(fuelType) {
  return fuelType === "essence" ? "default" : "secondary"
}
</script>
