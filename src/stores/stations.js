import { defineStore } from "pinia"
import { ref } from "vue"

export const useStationsStore = defineStore("stations", () => {
  const stations = ref([
    {
      id: 1,
      name: "Station Total - Paris 15ème",
      address: "123 Rue de Vaugirard, 75015 Paris",
      location: { lat: 48.8422, lng: 2.3014 },
      status: "online",
      tanks: [
        {
          id: 1,
          name: "Cuve 1",
          fuelType: "essence",
          capacity: 10000,
          level: 8500,
          percentage: 85,
          temperature: 22,
        },
        {
          id: 2,
          name: "Cuve 2",
          fuelType: "gasoil",
          capacity: 10000,
          level: 5900,
          percentage: 59,
          temperature: 21,
        },
      ],
    },
    {
      id: 2,
      name: "Station Shell - Lyon Centre",
      address: "45 Rue de la République, 69002 Lyon",
      location: { lat: 45.764, lng: 4.8357 },
      status: "online",
      tanks: [
        {
          id: 3,
          name: "Cuve 1",
          fuelType: "essence",
          capacity: 12000,
          level: 9600,
          percentage: 80,
          temperature: 23,
        },
        {
          id: 4,
          name: "Cuve 2",
          fuelType: "gasoil",
          capacity: 12000,
          level: 7200,
          percentage: 60,
          temperature: 22,
        },
      ],
    },
    {
      id: 3,
      name: "Station BP - Marseille Nord",
      address: "78 Avenue du Prado, 13008 Marseille",
      location: { lat: 43.2965, lng: 5.3698 },
      status: "online",
      tanks: [
        {
          id: 5,
          name: "Cuve 1",
          fuelType: "essence",
          capacity: 8000,
          level: 1280,
          percentage: 16,
          temperature: 25,
        },
        {
          id: 6,
          name: "Cuve 2",
          fuelType: "gasoil",
          capacity: 8000,
          level: 6400,
          percentage: 80,
          temperature: 24,
        },
      ],
    },
    {
      id: 4,
      name: "Station Esso - Toulouse Sud",
      address: "12 Route de Narbonne, 31400 Toulouse",
      location: { lat: 43.6047, lng: 1.4442 },
      status: "maintenance",
      tanks: [
        {
          id: 7,
          name: "Cuve 1",
          fuelType: "essence",
          capacity: 10000,
          level: 4500,
          percentage: 45,
          temperature: 0,
        },
        {
          id: 8,
          name: "Cuve 2",
          fuelType: "gasoil",
          capacity: 10000,
          level: 8000,
          percentage: 80,
          temperature: 23,
        },
      ],
    },
  ])

  const currentStation = ref(null)
  const loading = ref(false)

  async function fetchStations() {
    loading.value = true
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      // Data is already loaded in ref
    } catch (error) {
      console.error("Failed to fetch stations:", error)
    } finally {
      loading.value = false
    }
  }

  async function fetchStation(id) {
    loading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      currentStation.value = stations.value.find((s) => s.id === Number.parseInt(id))
    } catch (error) {
      console.error("Failed to fetch station:", error)
    } finally {
      loading.value = false
    }
  }

  function updateTankLevel(stationId, tankId, data) {
    const station = stations.value.find((s) => s.id === stationId)
    if (station) {
      const tank = station.tanks.find((t) => t.id === tankId)
      if (tank) {
        Object.assign(tank, data)
      }
    }
  }

  return {
    stations,
    currentStation,
    loading,
    fetchStations,
    fetchStation,
    updateTankLevel,
  }
})
