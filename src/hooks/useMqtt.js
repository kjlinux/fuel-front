import { ref, onMounted, onUnmounted } from "vue"
import mqtt from "mqtt"
import { useStationsStore } from "@/stores/stations"
import { useAlertsStore } from "@/stores/alerts"
import { useDeliveriesStore } from "@/stores/deliveries"

export function useMqtt() {
  const client = ref(null)
  const connected = ref(false)
  const stationsStore = useStationsStore()
  const alertsStore = useAlertsStore()
  const deliveriesStore = useDeliveriesStore()

  // Track previous tank levels for delivery detection
  const previousLevels = ref(new Map())

  // Check if MQTT is enabled via environment variable
  const mqttEnabled = import.meta.env.VITE_MQTT_ENABLED === 'true'

  function connect(brokerUrl) {
    // Skip MQTT connection if not enabled or no broker URL provided
    if (!mqttEnabled && !brokerUrl) {
      console.log("MQTT disabled - using simulated data mode")
      connected.value = false
      startSimulatedData()
      return
    }

    const defaultBrokerUrl = import.meta.env.VITE_MQTT_BROKER_URL || brokerUrl || "ws://localhost:8083/mqtt"

    try {
      client.value = mqtt.connect(defaultBrokerUrl, {
        clientId: `fueltrack_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      })

      client.value.on("connect", () => {
        connected.value = true
        console.log("MQTT connected")

        // Subscribe to all station topics
        client.value.subscribe("station/+/tank/+/level")
        client.value.subscribe("station/+/tank/+/alert")
      })

      client.value.on("message", (topic, message) => {
        const parts = topic.split("/")
        const stationId = Number(parts[1])
        const tankId = Number(parts[3])
        const messageType = parts[4]

        const data = JSON.parse(message.toString())

        if (messageType === "level") {
          detectDelivery(stationId, tankId, data)
          stationsStore.updateTankLevel(stationId, tankId, data)
        } else if (messageType === "alert") {
          alertsStore.addAlert({
            type: data.type,
            severity: data.severity,
            stationId,
            tankId,
            message: data.message,
          })
        }
      })

      client.value.on("error", (error) => {
        console.error("MQTT error:", error)
        // Fallback to simulated data on error
        if (!connected.value) {
          console.log("MQTT connection failed - switching to simulated data")
          startSimulatedData()
        }
      })

      client.value.on("close", () => {
        connected.value = false
        console.log("MQTT disconnected")
      })
    } catch (error) {
      console.error("Failed to initialize MQTT:", error)
      startSimulatedData()
    }
  }

  // Detect delivery based on significant level increase
  function detectDelivery(stationId, tankId, data) {
    const key = `${stationId}-${tankId}`
    const previousLevel = previousLevels.value.get(key)

    if (previousLevel !== undefined && data.level !== undefined) {
      const levelDifference = data.level - previousLevel
      const DELIVERY_THRESHOLD = 1000 // Minimum 1000L increase to consider it a delivery

      // If level increased significantly, it's likely a delivery
      if (levelDifference >= DELIVERY_THRESHOLD) {
        const station = stationsStore.stations.find((s) => s.id === stationId)
        const tank = station?.tanks.find((t) => t.id === tankId)

        if (station && tank) {
          console.log(`Delivery detected: ${levelDifference}L added to tank ${tankId} at station ${stationId}`)

          // Auto-create delivery record
          deliveriesStore.addDelivery({
            stationId,
            stationName: station.name,
            tankId,
            tankName: tank.name,
            fuelType: tank.fuelType,
            levelBefore: Math.round(previousLevel),
            quantityDelivered: Math.round(levelDifference),
            levelAfter: Math.round(data.level),
            deliveredBy: "Auto-détecté",
            driverName: "N/A",
            truckNumber: "N/A",
            orderNumber: `AUTO-${Date.now()}`,
            notes: "Livraison détectée automatiquement via MQTT",
            temperature: data.temperature || 20,
          })

          // Create alert for delivery notification
          alertsStore.addAlert({
            type: "delivery",
            severity: "info",
            stationId,
            tankId,
            stationName: station.name,
            tankName: tank.name,
            fuelType: tank.fuelType,
            message: `Livraison détectée: +${Math.round(levelDifference)}L`,
            details: `Une augmentation de ${Math.round(levelDifference)}L a été détectée dans la ${tank.name} (${tank.fuelType}) de ${station.name}.`,
          })
        }
      }
    }

    // Update previous level
    previousLevels.value.set(key, data.level)
  }

  function startSimulatedData() {
    // Simulate real-time data updates when MQTT is not available
    console.log("Starting simulated data mode")

    // Initialize previous levels from current station data
    stationsStore.stations.forEach((station) => {
      station.tanks.forEach((tank) => {
        const key = `${station.id}-${tank.id}`
        previousLevels.value.set(key, tank.level)
      })
    })

    // Simulate data updates every 10 seconds
    const interval = setInterval(() => {
      // Simulate random tank level updates
      if (Math.random() < 0.3) {
        const stationId = Math.floor(Math.random() * 4) + 1
        const tankId = Math.floor(Math.random() * 2) + 1

        const newLevel = 50 + Math.random() * 40
        detectDelivery(stationId, tankId, { level: newLevel, temperature: 20 + Math.random() * 10 })

        stationsStore.updateTankLevel(stationId, tankId, {
          level: newLevel,
          temperature: 20 + Math.random() * 10
        })
      }

      // Simulate random alerts
      if (Math.random() < 0.05) {
        alertsStore.addAlert({
          type: Math.random() > 0.5 ? 'low_level' : 'temperature',
          severity: Math.random() > 0.7 ? 'critical' : 'warning',
          stationId: Math.floor(Math.random() * 4) + 1,
          tankId: Math.floor(Math.random() * 2) + 1,
          message: 'Alerte simulée'
        })
      }

      // Occasionally simulate a delivery (every ~60 seconds on average)
      if (Math.random() < 0.02) {
        const stationId = Math.floor(Math.random() * 4) + 1
        const tankId = Math.floor(Math.random() * 2) + 1
        const key = `${stationId}-${tankId}`
        const currentLevel = previousLevels.value.get(key) || 2000
        const deliveryAmount = 10000 + Math.random() * 10000 // 10-20k liters

        detectDelivery(stationId, tankId, {
          level: currentLevel + deliveryAmount,
          temperature: 20 + Math.random() * 5
        })

        stationsStore.updateTankLevel(stationId, tankId, {
          level: currentLevel + deliveryAmount,
          temperature: 20 + Math.random() * 5
        })
      }
    }, 10000)

    // Store interval for cleanup
    if (!client.value) {
      client.value = { simulationInterval: interval }
    }
  }

  function disconnect() {
    if (client.value) {
      // Clear simulation interval if exists
      if (client.value.simulationInterval) {
        clearInterval(client.value.simulationInterval)
      } else if (client.value.end) {
        client.value.end()
      }
      client.value = null
      connected.value = false
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    client,
    connected,
    connect,
    disconnect,
  }
}
