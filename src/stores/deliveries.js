import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { deliveriesApi } from "@/services/api"

export const useDeliveriesStore = defineStore("deliveries", () => {
  const deliveries = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  })

  // Computed
  const pendingDeliveries = computed(() =>
    deliveries.value.filter((d) => !d.validated)
  )
  const validatedDeliveries = computed(() =>
    deliveries.value.filter((d) => d.validated)
  )

  const totalDeliveriesThisMonth = computed(() => {
    const now = new Date()
    return deliveries.value.filter((d) => {
      const deliveryDate = new Date(d.deliveryDate)
      return (
        deliveryDate.getMonth() === now.getMonth() &&
        deliveryDate.getFullYear() === now.getFullYear()
      )
    }).length
  })

  const totalVolumeThisMonth = computed(() => {
    const now = new Date()
    const thisMonth = deliveries.value.filter((d) => {
      const deliveryDate = new Date(d.deliveryDate)
      return (
        deliveryDate.getMonth() === now.getMonth() &&
        deliveryDate.getFullYear() === now.getFullYear()
      )
    })
    return thisMonth.reduce((sum, d) => sum + d.quantityDelivered, 0)
  })

  const averageDeliveryVolume = computed(() => {
    if (deliveries.value.length === 0) return 0
    const total = deliveries.value.reduce((sum, d) => sum + d.quantityDelivered, 0)
    return Math.round(total / deliveries.value.length)
  })

  // Fetch deliveries with optional filters
  async function fetchDeliveries(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await deliveriesApi.getAll(params)
      deliveries.value = response.data.map(transformDelivery)

      if (response.meta) {
        pagination.value = {
          currentPage: response.meta.current_page,
          lastPage: response.meta.last_page,
          total: response.meta.total,
          perPage: response.meta.per_page,
        }
      }

      return deliveries.value
    } catch (err) {
      error.value = err.message
      console.error("Failed to fetch deliveries:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get single delivery
  async function fetchDelivery(id) {
    loading.value = true
    try {
      const response = await deliveriesApi.getOne(id)
      return transformDelivery(response.data)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create delivery
  async function addDelivery(deliveryData) {
    loading.value = true
    try {
      const response = await deliveriesApi.create({
        station_id: deliveryData.stationId,
        tank_id: deliveryData.tankId,
        fuel_type: deliveryData.fuelType,
        level_before: deliveryData.levelBefore,
        quantity_delivered: deliveryData.quantityDelivered,
        level_after: deliveryData.levelAfter,
        delivery_date: deliveryData.deliveryDate,
        delivered_by: deliveryData.deliveredBy,
        driver_name: deliveryData.driverName,
        truck_number: deliveryData.truckNumber,
        order_number: deliveryData.orderNumber,
        notes: deliveryData.notes,
        temperature: deliveryData.temperature,
        density: deliveryData.density,
      })
      const newDelivery = transformDelivery(response.data)
      deliveries.value.unshift(newDelivery)
      return newDelivery
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update delivery
  async function updateDelivery(deliveryId, updates) {
    try {
      const response = await deliveriesApi.update(deliveryId, {
        station_id: updates.stationId,
        tank_id: updates.tankId,
        fuel_type: updates.fuelType,
        level_before: updates.levelBefore,
        quantity_delivered: updates.quantityDelivered,
        level_after: updates.levelAfter,
        delivery_date: updates.deliveryDate,
        delivered_by: updates.deliveredBy,
        driver_name: updates.driverName,
        truck_number: updates.truckNumber,
        order_number: updates.orderNumber,
        notes: updates.notes,
        temperature: updates.temperature,
        density: updates.density,
      })
      const updatedDelivery = transformDelivery(response.data)

      const index = deliveries.value.findIndex((d) => d.id === deliveryId)
      if (index !== -1) {
        deliveries.value[index] = updatedDelivery
      }

      return updatedDelivery
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Validate delivery
  async function validateDelivery(deliveryId) {
    try {
      const response = await deliveriesApi.validate(deliveryId)
      const updatedDelivery = transformDelivery(response.data)

      const index = deliveries.value.findIndex((d) => d.id === deliveryId)
      if (index !== -1) {
        deliveries.value[index] = updatedDelivery
      }

      return updatedDelivery
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Delete delivery
  async function deleteDelivery(deliveryId) {
    try {
      await deliveriesApi.delete(deliveryId)
      deliveries.value = deliveries.value.filter((d) => d.id !== deliveryId)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Transform API response to frontend format
  function transformDelivery(apiDelivery) {
    return {
      id: apiDelivery.id,
      stationId: apiDelivery.station_id,
      stationName: apiDelivery.station?.name || "Station inconnue",
      tankId: apiDelivery.tank_id,
      tankName: apiDelivery.tank?.name || "Cuve inconnue",
      fuelType: apiDelivery.fuel_type,
      levelBefore: parseFloat(apiDelivery.level_before),
      quantityDelivered: parseFloat(apiDelivery.quantity_delivered),
      levelAfter: parseFloat(apiDelivery.level_after),
      deliveryDate: new Date(apiDelivery.delivery_date),
      deliveredBy: apiDelivery.delivered_by,
      driverName: apiDelivery.driver_name,
      truckNumber: apiDelivery.truck_number,
      orderNumber: apiDelivery.order_number,
      notes: apiDelivery.notes,
      temperature: parseFloat(apiDelivery.temperature) || null,
      density: parseFloat(apiDelivery.density) || null,
      validated: apiDelivery.validated,
      validatedBy: apiDelivery.validator?.name || apiDelivery.validated_by,
      validatedAt: apiDelivery.validated_at
        ? new Date(apiDelivery.validated_at)
        : null,
    }
  }

  // Get deliveries by station
  function getDeliveriesByStation(stationId) {
    return deliveries.value.filter((d) => d.stationId === stationId)
  }

  // Get deliveries by tank
  function getDeliveriesByTank(tankId) {
    return deliveries.value.filter((d) => d.tankId === tankId)
  }

  return {
    deliveries,
    loading,
    error,
    pagination,
    pendingDeliveries,
    validatedDeliveries,
    totalDeliveriesThisMonth,
    totalVolumeThisMonth,
    averageDeliveryVolume,
    fetchDeliveries,
    fetchDelivery,
    addDelivery,
    updateDelivery,
    validateDelivery,
    deleteDelivery,
    getDeliveriesByStation,
    getDeliveriesByTank,
  }
})
