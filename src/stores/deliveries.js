import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useDeliveriesStore = defineStore("deliveries", () => {
  const deliveries = ref([
    {
      id: 1,
      stationId: 1,
      stationName: "Station Total - Paris 15ème",
      tankId: 2,
      tankName: "Cuve 2",
      fuelType: "gasoil",
      levelBefore: 2000, // litres
      quantityDelivered: 18000, // litres
      levelAfter: 20000, // litres
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deliveredBy: "Transport Pétrolier SA",
      driverName: "Jean Dupont",
      truckNumber: "AB-123-CD",
      orderNumber: "CMD-2025-001",
      notes: "Livraison standard",
      temperature: 18,
      density: 0.85,
      validated: true,
      validatedBy: "Admin User",
      validatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    },
    {
      id: 2,
      stationId: 3,
      stationName: "Station BP - Marseille Nord",
      tankId: 5,
      tankName: "Cuve 1",
      fuelType: "essence",
      levelBefore: 1280,
      quantityDelivered: 15000,
      levelAfter: 16280,
      deliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      deliveredBy: "Express Fuel Logistics",
      driverName: "Marie Martin",
      truckNumber: "EF-456-GH",
      orderNumber: "CMD-2025-002",
      notes: "Livraison urgente - Niveau critique",
      temperature: 20,
      density: 0.74,
      validated: true,
      validatedBy: "Admin User",
      validatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
    },
    {
      id: 3,
      stationId: 2,
      stationName: "Station Shell - Lyon Centre",
      tankId: 4,
      tankName: "Cuve 2",
      fuelType: "gasoil",
      levelBefore: 5200,
      quantityDelivered: 10000,
      levelAfter: 15200,
      deliveryDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
      deliveredBy: "Transport Pétrolier SA",
      driverName: "Pierre Leroy",
      truckNumber: "AB-789-IJ",
      orderNumber: "CMD-2025-003",
      notes: "",
      temperature: 19,
      density: 0.85,
      validated: false,
      validatedBy: null,
      validatedAt: null,
    },
  ])

  const pendingDeliveries = computed(() => deliveries.value.filter((d) => !d.validated))
  const validatedDeliveries = computed(() => deliveries.value.filter((d) => d.validated))

  // Statistiques
  const totalDeliveriesThisMonth = computed(() => {
    const now = new Date()
    const thisMonth = deliveries.value.filter((d) => {
      const deliveryDate = new Date(d.deliveryDate)
      return deliveryDate.getMonth() === now.getMonth() && deliveryDate.getFullYear() === now.getFullYear()
    })
    return thisMonth.length
  })

  const totalVolumeThisMonth = computed(() => {
    const now = new Date()
    const thisMonth = deliveries.value.filter((d) => {
      const deliveryDate = new Date(d.deliveryDate)
      return deliveryDate.getMonth() === now.getMonth() && deliveryDate.getFullYear() === now.getFullYear()
    })
    return thisMonth.reduce((sum, d) => sum + d.quantityDelivered, 0)
  })

  const averageDeliveryVolume = computed(() => {
    if (deliveries.value.length === 0) return 0
    const total = deliveries.value.reduce((sum, d) => sum + d.quantityDelivered, 0)
    return Math.round(total / deliveries.value.length)
  })

  function addDelivery(deliveryData) {
    const newDelivery = {
      id: Date.now(),
      deliveryDate: new Date(),
      validated: false,
      validatedBy: null,
      validatedAt: null,
      temperature: 20,
      density: deliveryData.fuelType === "essence" ? 0.74 : 0.85,
      ...deliveryData,
    }
    deliveries.value.unshift(newDelivery)
    return newDelivery
  }

  function validateDelivery(deliveryId, validatedBy) {
    const delivery = deliveries.value.find((d) => d.id === deliveryId)
    if (delivery) {
      delivery.validated = true
      delivery.validatedBy = validatedBy
      delivery.validatedAt = new Date()
    }
  }

  function updateDelivery(deliveryId, updates) {
    const delivery = deliveries.value.find((d) => d.id === deliveryId)
    if (delivery) {
      Object.assign(delivery, updates)
    }
  }

  function deleteDelivery(deliveryId) {
    const index = deliveries.value.findIndex((d) => d.id === deliveryId)
    if (index > -1) {
      deliveries.value.splice(index, 1)
    }
  }

  async function fetchDeliveries() {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
  }

  function getDeliveriesByStation(stationId) {
    return deliveries.value.filter((d) => d.stationId === stationId)
  }

  function getDeliveriesByTank(tankId) {
    return deliveries.value.filter((d) => d.tankId === tankId)
  }

  return {
    deliveries,
    pendingDeliveries,
    validatedDeliveries,
    totalDeliveriesThisMonth,
    totalVolumeThisMonth,
    averageDeliveryVolume,
    addDelivery,
    validateDelivery,
    updateDelivery,
    deleteDelivery,
    fetchDeliveries,
    getDeliveriesByStation,
    getDeliveriesByTank,
  }
})
