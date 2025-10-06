<template>
  <div
    v-if="open && alert"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    @click.self="closeDialog"
  >
    <Card class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <Badge :variant="severityVariant">
                {{ severityLabel }}
              </Badge>
              <Badge variant="outline">
                {{ typeLabel }}
              </Badge>
              <Badge v-if="alert.resolved" variant="success">
                <CheckCircle class="w-3 h-3 mr-1" />
              </Badge>
            </div>
            <CardTitle>{{ alert.message }}</CardTitle>
            <CardDescription class="mt-2">
              {{ formatTimestamp(alert.timestamp) }}
            </CardDescription>
          </div>
          
          <Button variant="ghost" size="icon" @click="closeDialog">
            <X class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent class="space-y-6">
        <!-- Alert Info Grid -->
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Station</p>
            <p class="text-sm text-foreground">{{ getStationName(alert.stationId) }}</p>
          </div>
          
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Cuve</p>
            <p class="text-sm text-foreground">{{ getTankName(alert.tankId) }}</p>
          </div>
          
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Type d'alerte</p>
            <p class="text-sm text-foreground">{{ typeLabel }}</p>
          </div>
          
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Sévérité</p>
            <p class="text-sm text-foreground">{{ severityLabel }}</p>
          </div>
          
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Date de détection</p>
            <p class="text-sm text-foreground">{{ formatFullDate(alert.timestamp) }}</p>
          </div>
          
          <div v-if="alert.resolved" class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Date de résolution</p>
            <p class="text-sm text-foreground">{{ formatFullDate(alert.resolvedAt) }}</p>
          </div>
        </div>

        <!-- Details -->
        <div v-if="alert.details" class="space-y-2">
          <h4 class="text-sm font-semibold text-foreground">Détails</h4>
          <div class="p-4 rounded-lg bg-muted/50 text-sm text-foreground">
            {{ alert.details }}
          </div>
        </div>

        <!-- Recommended Actions -->
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-foreground">Actions recommandées</h4>
          <ul class="space-y-2">
            <li
              v-for="(action, index) in getRecommendedActions(alert.type)"
              :key="index"
              class="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{{ action }}</span>
            </li>
          </ul>
        </div>

        <!-- Resolution Notes -->
        <div v-if="alert.resolved && alert.resolutionNotes" class="space-y-2">
          <h4 class="text-sm font-semibold text-foreground">Notes de résolution</h4>
          <div class="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-foreground">
            {{ alert.resolutionNotes }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="outline" @click="viewStation(alert.stationId)">
            <MapPin class="w-4 h-4 mr-2" />
          </Button>
          
          <div class="flex items-center gap-2">
            <Button variant="outline" @click="closeDialog">
              Fermer
            </Button>
            <Button
              v-if="!alert.resolved"
              variant="primary"
              @click="$emit('resolve', alert)"
            >
              <CheckCircle class="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatDistanceToNow } from 'date-fns'
import { X, CheckCircle, MapPin } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  alert: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open', 'resolve'])
const router = useRouter()

const severityConfig = {
  critical: { label: 'Critique', variant: 'destructive' },
  warning: { label: 'Attention', variant: 'warning' },
  info: { label: 'Info', variant: 'default' }
}

const typeLabels = {
  low_level: 'Niveau bas',
  anomaly: 'Anomalie détectée',
  disconnected: 'Déconnexion capteur',
  temperature: 'Température anormale'
}

const severityLabel = computed(() => severityConfig[props.alert?.severity]?.label || 'Inconnu')
const severityVariant = computed(() => severityConfig[props.alert?.severity]?.variant || 'default')
const typeLabel = computed(() => typeLabels[props.alert?.type] || props.alert?.type)

function getStationName(stationId) {
  const stations = {
    1: 'Station Total Dakar',
    2: 'Station Shell Rufisque',
    3: 'Station Elton Thiès',
    4: 'Station Oilibya Mbour'
  }
  return stations[stationId] || `Station #${stationId}`
}

function getTankName(tankId) {
  const tanks = {
    1: 'Cuve Essence 1',
    2: 'Cuve Gasoil 1',
    3: 'Cuve Essence 1',
    4: 'Cuve Gasoil 1',
    5: 'Cuve Essence 1',
    6: 'Cuve Gasoil 1'
  }
  return tanks[tankId] || `Cuve #${tankId}`
}

function getRecommendedActions(type) {
  const actions = {
    low_level: [
      'Planifier un réapprovisionnement immédiat',
      'Vérifier les prévisions de consommation',
      'Contacter le fournisseur de carburant',
      'Informer le responsable de la station'
    ],
    anomaly: [
      'Inspecter la cuve pour détecter une fuite éventuelle',
      'Vérifier le bon fonctionnement des capteurs',
      'Analyser l\'historique de consommation',
      'Faire intervenir un technicien si nécessaire'
    ],
    disconnected: [
      'Vérifier la connexion réseau de la station',
      'Redémarrer le capteur IoT',
      'Contrôler l\'alimentation électrique',
      'Contacter le support technique si le problème persiste'
    ],
    temperature: [
      'Vérifier le système de refroidissement',
      'Contrôler les conditions ambiantes',
      'Inspecter l\'isolation de la cuve',
      'Surveiller l\'évolution de la température'
    ]
  }
  return actions[type] || ['Contacter le support technique']
}

function formatTimestamp(timestamp) {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: fr
  })
}

function formatFullDate(timestamp) {
  return format(new Date(timestamp), 'dd MMMM yyyy à HH:mm', { locale: fr })
}

function viewStation(stationId) {
  router.push({ name: 'station-detail', params: { id: stationId } })
  closeDialog()
}

function closeDialog() {
  emit('update:open', false)
}
</script>
