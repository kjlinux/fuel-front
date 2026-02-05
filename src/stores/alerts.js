import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { alertsApi } from "@/services/api"

export const useAlertsStore = defineStore("alerts", () => {
  const alerts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  })

  // Computed
  const activeAlerts = computed(() => alerts.value.filter((a) => !a.resolved))
  const resolvedAlerts = computed(() => alerts.value.filter((a) => a.resolved))
  const criticalAlerts = computed(() =>
    activeAlerts.value.filter((a) => a.severity === "critical")
  )
  const warningAlerts = computed(() =>
    activeAlerts.value.filter((a) => a.severity === "warning")
  )

  // Fetch alerts with optional filters
  async function fetchAlerts(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await alertsApi.getAll(params)
      alerts.value = response.data.map(transformAlert)

      if (response.meta) {
        pagination.value = {
          currentPage: response.meta.current_page,
          lastPage: response.meta.last_page,
          total: response.meta.total,
          perPage: response.meta.per_page,
        }
      }

      return alerts.value
    } catch (err) {
      error.value = err.message
      console.error("Failed to fetch alerts:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get single alert
  async function fetchAlert(id) {
    loading.value = true
    try {
      const response = await alertsApi.getOne(id)
      return transformAlert(response.data)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Resolve alert
  async function resolveAlert(alertId, notes = "") {
    try {
      const response = await alertsApi.resolve(alertId, notes)
      const updatedAlert = transformAlert(response.data)

      const index = alerts.value.findIndex((a) => a.id === alertId)
      if (index !== -1) {
        alerts.value[index] = updatedAlert
      }

      return updatedAlert
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Delete alert
  async function deleteAlert(alertId) {
    try {
      await alertsApi.delete(alertId)
      alerts.value = alerts.value.filter((a) => a.id !== alertId)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Add alert locally (from MQTT real-time)
  function addAlert(alertData) {
    const newAlert = transformAlert({
      id: alertData.id || Date.now().toString(),
      ...alertData,
      created_at: new Date().toISOString(),
    })
    alerts.value.unshift(newAlert)
    return newAlert
  }

  // Transform API response to frontend format
  function transformAlert(apiAlert) {
    return {
      id: apiAlert.id,
      type: apiAlert.type,
      severity: apiAlert.severity,
      stationId: apiAlert.station_id,
      stationName: apiAlert.station?.name || apiAlert.station_name || "Station inconnue",
      tankId: apiAlert.tank_id,
      tankName: apiAlert.tank?.name || apiAlert.tank_name || "Cuve inconnue",
      fuelType: apiAlert.tank?.fuel_type || apiAlert.fuel_type,
      message: apiAlert.message,
      details: apiAlert.details,
      timestamp: new Date(apiAlert.created_at),
      resolved: apiAlert.resolved,
      resolvedAt: apiAlert.resolved_at ? new Date(apiAlert.resolved_at) : null,
      resolutionNotes: apiAlert.resolution_notes,
    }
  }

  // Get alerts by station
  function getAlertsByStation(stationId) {
    return alerts.value.filter((a) => a.stationId === stationId)
  }

  // Get alerts by tank
  function getAlertsByTank(tankId) {
    return alerts.value.filter((a) => a.tankId === tankId)
  }

  return {
    alerts,
    loading,
    error,
    pagination,
    activeAlerts,
    resolvedAlerts,
    criticalAlerts,
    warningAlerts,
    fetchAlerts,
    fetchAlert,
    resolveAlert,
    deleteAlert,
    addAlert,
    getAlertsByStation,
    getAlertsByTank,
  }
})
