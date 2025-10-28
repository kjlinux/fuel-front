import { ref, onMounted, onUnmounted } from "vue"
import mqtt from "mqtt"
import { useStationsStore } from "@/stores/stations"
import { useAlertsStore } from "@/stores/alerts"

export function useMqtt() {
  const client = ref(null)
  const connected = ref(false)
  const stationsStore = useStationsStore()
  const alertsStore = useAlertsStore()

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
        const stationId = parts[1]
        const tankId = parts[3]
        const messageType = parts[4]

        const data = JSON.parse(message.toString())

        if (messageType === "level") {
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

  function startSimulatedData() {
    // Simulate real-time data updates when MQTT is not available
    console.log("Starting simulated data mode")

    // Simulate data updates every 10 seconds
    const interval = setInterval(() => {
      // Simulate random tank level updates
      if (Math.random() < 0.3) {
        const stationId = Math.floor(Math.random() * 4) + 1
        const tankId = Math.floor(Math.random() * 2) + 1

        stationsStore.updateTankLevel(stationId, tankId, {
          level: 50 + Math.random() * 40,
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
