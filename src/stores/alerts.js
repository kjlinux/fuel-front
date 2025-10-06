import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useAlertsStore = defineStore("alerts", () => {
  const alerts = ref([
    {
      id: 1,
      type: "low_level",
      severity: "warning",
      stationId: 3,
      stationName: "Station BP - Marseille Nord",
      tankId: 5,
      tankName: "Cuve 1",
      fuelType: "essence",
      message: "Niveau bas détecté - Essence (16%)",
      details:
        "Le niveau de carburant est descendu en dessous du seuil de 20%. Un réapprovisionnement est recommandé dans les prochaines 24 heures.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resolved: false,
      resolvedAt: null,
      resolutionNotes: null,
    },
    {
      id: 2,
      type: "anomaly",
      severity: "critical",
      stationId: 2,
      stationName: "Station Shell - Lyon Centre",
      tankId: 4,
      tankName: "Cuve 2",
      fuelType: "gasoil",
      message: "Baisse anormale détectée - Possible fuite",
      details:
        "Une diminution de 500 litres en 30 minutes a été détectée, ce qui est anormal par rapport aux patterns de consommation habituels. Une inspection physique est fortement recommandée.",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      resolved: false,
      resolvedAt: null,
      resolutionNotes: null,
    },
    {
      id: 3,
      type: "temperature",
      severity: "warning",
      stationId: 1,
      stationName: "Station Total - Paris 15ème",
      tankId: 1,
      tankName: "Cuve 1",
      fuelType: "essence",
      message: "Température élevée - Essence (32°C)",
      details:
        "La température de la cuve a dépassé le seuil recommandé de 30°C. Vérifier le système de refroidissement.",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      resolved: false,
      resolvedAt: null,
      resolutionNotes: null,
    },
    {
      id: 4,
      type: "disconnected",
      severity: "critical",
      stationId: 4,
      stationName: "Station Esso - Toulouse Sud",
      tankId: 7,
      tankName: "Cuve 1",
      fuelType: "essence",
      message: "Capteur déconnecté - Perte de signal",
      details: "Le capteur IoT ne répond plus depuis 15 minutes. Vérifier la connexion réseau et l'alimentation.",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      resolved: false,
      resolvedAt: null,
      resolutionNotes: null,
    },
    {
      id: 5,
      type: "low_level",
      severity: "info",
      stationId: 1,
      stationName: "Station Total - Paris 15ème",
      tankId: 2,
      tankName: "Cuve 2",
      fuelType: "gasoil",
      message: "Niveau modéré - Gasoil (59%)",
      details: "Le niveau approche du seuil de réapprovisionnement. Planifier une livraison dans les prochains jours.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      resolved: true,
      resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      resolutionNotes: "Livraison planifiée pour demain matin",
    },
  ])

  const activeAlerts = computed(() => alerts.value.filter((a) => !a.resolved))
  const criticalAlerts = computed(() => activeAlerts.value.filter((a) => a.severity === "critical"))

  function addAlert(alertData) {
    const newAlert = {
      id: Date.now(),
      timestamp: new Date(),
      resolved: false,
      resolvedAt: null,
      resolutionNotes: null,
      ...alertData,
    }
    alerts.value.unshift(newAlert)
    return newAlert
  }

  function resolveAlert(alertId, notes = "") {
    const alert = alerts.value.find((a) => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      alert.resolutionNotes = notes || "Alerte résolue"
    }
  }

  async function fetchAlerts() {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
  }

  return {
    alerts,
    activeAlerts,
    criticalAlerts,
    addAlert,
    resolveAlert,
    fetchAlerts,
  }
})
