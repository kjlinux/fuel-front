import { ref, onMounted, onUnmounted } from "vue"
import mqtt from "mqtt"
import { useStationsStore } from "@/stores/stations"
import { useAlertsStore } from "@/stores/alerts"

export function useMqtt() {
  const client = ref(null)
  const connected = ref(false)
  const stationsStore = useStationsStore()
  const alertsStore = useAlertsStore()

  function connect(brokerUrl = "ws://localhost:8083/mqtt") {
    client.value = mqtt.connect(brokerUrl, {
      clientId: `fueltrack_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 1000,
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
    })

    client.value.on("close", () => {
      connected.value = false
      console.log("MQTT disconnected")
    })
  }

  function disconnect() {
    if (client.value) {
      client.value.end()
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
