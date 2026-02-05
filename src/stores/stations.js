import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { stationsApi, tanksApi } from "@/services/api"

export const useStationsStore = defineStore("stations", () => {
  const stations = ref([])
  const currentStation = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const onlineStations = computed(() =>
    stations.value.filter((s) => s.status === "online")
  )
  const offlineStations = computed(() =>
    stations.value.filter((s) => s.status === "offline")
  )
  const maintenanceStations = computed(() =>
    stations.value.filter((s) => s.status === "maintenance")
  )
  const totalTanks = computed(() =>
    stations.value.reduce((sum, s) => sum + (s.tanks?.length || 0), 0)
  )

  // Fetch all stations
  async function fetchStations(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await stationsApi.getAll(params)
      stations.value = response.data.map(transformStation)
      return stations.value
    } catch (err) {
      error.value = err.message
      console.error("Failed to fetch stations:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch single station with tanks
  async function fetchStation(id) {
    loading.value = true
    error.value = null
    try {
      const response = await stationsApi.getOne(id)
      currentStation.value = transformStation(response.data)
      return currentStation.value
    } catch (err) {
      error.value = err.message
      console.error("Failed to fetch station:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create new station
  async function createStation(data) {
    loading.value = true
    try {
      const response = await stationsApi.create({
        name: data.name,
        address: data.address,
        latitude: data.latitude || data.location?.lat,
        longitude: data.longitude || data.location?.lng,
        status: data.status || "offline",
        manager: data.manager,
        phone: data.phone,
        email: data.email,
      })
      const newStation = transformStation(response.data)
      stations.value.push(newStation)
      return newStation
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update station
  async function updateStation(id, data) {
    loading.value = true
    try {
      const response = await stationsApi.update(id, {
        name: data.name,
        address: data.address,
        latitude: data.latitude || data.location?.lat,
        longitude: data.longitude || data.location?.lng,
        status: data.status,
        manager: data.manager,
        phone: data.phone,
        email: data.email,
      })
      const updatedStation = transformStation(response.data)
      const index = stations.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        stations.value[index] = updatedStation
      }
      if (currentStation.value?.id === id) {
        currentStation.value = updatedStation
      }
      return updatedStation
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete station
  async function deleteStation(id) {
    loading.value = true
    try {
      await stationsApi.delete(id)
      stations.value = stations.value.filter((s) => s.id !== id)
      if (currentStation.value?.id === id) {
        currentStation.value = null
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Tank operations
  async function createTank(stationId, data) {
    try {
      const response = await tanksApi.create(stationId, {
        name: data.name,
        fuel_type: data.fuelType,
        capacity: data.capacity,
        current_level: data.currentLevel || data.level || 0,
        sensor_id: data.sensorId,
      })
      const newTank = transformTank(response.data)

      // Update local station tanks
      const station = stations.value.find((s) => s.id === stationId)
      if (station) {
        if (!station.tanks) station.tanks = []
        station.tanks.push(newTank)
      }
      if (currentStation.value?.id === stationId) {
        if (!currentStation.value.tanks) currentStation.value.tanks = []
        currentStation.value.tanks.push(newTank)
      }

      return newTank
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function updateTank(tankId, data) {
    try {
      const response = await tanksApi.update(tankId, {
        name: data.name,
        fuel_type: data.fuelType,
        capacity: data.capacity,
        current_level: data.currentLevel || data.level,
        sensor_id: data.sensorId,
      })
      const updatedTank = transformTank(response.data)

      // Update in all stations
      stations.value.forEach((station) => {
        const tankIndex = station.tanks?.findIndex((t) => t.id === tankId)
        if (tankIndex !== -1) {
          station.tanks[tankIndex] = updatedTank
        }
      })

      if (currentStation.value?.tanks) {
        const tankIndex = currentStation.value.tanks.findIndex(
          (t) => t.id === tankId
        )
        if (tankIndex !== -1) {
          currentStation.value.tanks[tankIndex] = updatedTank
        }
      }

      return updatedTank
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function deleteTank(tankId) {
    try {
      await tanksApi.delete(tankId)

      // Remove from all stations
      stations.value.forEach((station) => {
        if (station.tanks) {
          station.tanks = station.tanks.filter((t) => t.id !== tankId)
        }
      })

      if (currentStation.value?.tanks) {
        currentStation.value.tanks = currentStation.value.tanks.filter(
          (t) => t.id !== tankId
        )
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Real-time tank level update (from MQTT)
  function updateTankLevel(stationId, tankId, data) {
    const station = stations.value.find((s) => s.id === stationId)
    if (station) {
      const tank = station.tanks?.find((t) => t.id === tankId)
      if (tank) {
        Object.assign(tank, {
          level: data.level ?? tank.level,
          percentage: data.percentage ?? tank.percentage,
          temperature: data.temperature ?? tank.temperature,
        })
      }
    }

    if (currentStation.value?.id === stationId) {
      const tank = currentStation.value.tanks?.find((t) => t.id === tankId)
      if (tank) {
        Object.assign(tank, {
          level: data.level ?? tank.level,
          percentage: data.percentage ?? tank.percentage,
          temperature: data.temperature ?? tank.temperature,
        })
      }
    }
  }

  // Transform API response to frontend format
  function transformStation(apiStation) {
    return {
      id: apiStation.id,
      name: apiStation.name,
      address: apiStation.address,
      location: {
        lat: parseFloat(apiStation.latitude),
        lng: parseFloat(apiStation.longitude),
      },
      latitude: parseFloat(apiStation.latitude),
      longitude: parseFloat(apiStation.longitude),
      status: apiStation.status,
      manager: apiStation.manager,
      phone: apiStation.phone,
      email: apiStation.email,
      tanks: apiStation.tanks?.map(transformTank) || [],
      createdAt: apiStation.created_at,
      updatedAt: apiStation.updated_at,
    }
  }

  function transformTank(apiTank) {
    return {
      id: apiTank.id,
      stationId: apiTank.station_id,
      name: apiTank.name,
      fuelType: apiTank.fuel_type,
      capacity: parseFloat(apiTank.capacity),
      level: parseFloat(apiTank.current_level),
      currentLevel: parseFloat(apiTank.current_level),
      percentage: parseFloat(apiTank.percentage),
      temperature: parseFloat(apiTank.temperature) || null,
      sensorId: apiTank.sensor_id,
    }
  }

  return {
    stations,
    currentStation,
    loading,
    error,
    onlineStations,
    offlineStations,
    maintenanceStations,
    totalTanks,
    fetchStations,
    fetchStation,
    createStation,
    updateStation,
    deleteStation,
    createTank,
    updateTank,
    deleteTank,
    updateTankLevel,
  }
})
