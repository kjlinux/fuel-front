class MQTTService {
  constructor() {
    this.client = null
    this.connected = false
    this.subscribers = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect(options = {}) {
    const defaultOptions = {
      host: import.meta.env.VITE_MQTT_HOST || "broker.hivemq.com",
      port: import.meta.env.VITE_MQTT_PORT || 8884,
      protocol: "wss",
      clientId: `fuel_iot_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      username: import.meta.env.VITE_MQTT_USERNAME,
      password: import.meta.env.VITE_MQTT_PASSWORD,
    }

    const mqttOptions = { ...defaultOptions, ...options }

    try {
      // For demo purposes, we'll simulate MQTT connection
      // In production, use: this.client = mqtt.connect(mqttOptions)
      this.simulateConnection()

      this.setupEventHandlers()

      console.log("MQTT: Attempting to connect...")
    } catch (error) {
      console.error("MQTT: Connection error", error)
      this.handleConnectionError(error)
    }
  }

  simulateConnection() {
    // Simulate MQTT client for demo
    this.client = {
      connected: false,
      on: (event, callback) => {
        if (event === "connect") {
          setTimeout(() => {
            this.connected = true
            callback()
          }, 1000)
        }
      },
      subscribe: (topic, callback) => {
        console.log(`MQTT: Subscribed to ${topic}`)
        callback(null)
      },
      unsubscribe: (topic, callback) => {
        console.log(`MQTT: Unsubscribed from ${topic}`)
        if (callback) callback(null)
      },
      publish: (topic, message, options, callback) => {
        console.log(`MQTT: Published to ${topic}`, message)
        if (callback) callback(null)
      },
      end: (force, callback) => {
        this.connected = false
        if (callback) callback()
      },
    }

    // Simulate incoming messages
    this.startMessageSimulation()
  }

  setupEventHandlers() {
    if (!this.client) return

    this.client.on("connect", () => {
      console.log("MQTT: Connected successfully")
      this.connected = true
      this.reconnectAttempts = 0
      this.notifySubscribers("connection", { status: "connected" })
    })

    this.client.on("error", (error) => {
      console.error("MQTT: Error", error)
      this.handleConnectionError(error)
    })

    this.client.on("close", () => {
      console.log("MQTT: Connection closed")
      this.connected = false
      this.notifySubscribers("connection", { status: "disconnected" })
    })

    this.client.on("reconnect", () => {
      this.reconnectAttempts++
      console.log(`MQTT: Reconnecting... (attempt ${this.reconnectAttempts})`)

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("MQTT: Max reconnection attempts reached")
        this.disconnect()
      }
    })

    this.client.on("message", (topic, message) => {
      this.handleMessage(topic, message)
    })
  }

  startMessageSimulation() {
    // Simulate real-time sensor data every 5 seconds
    setInterval(() => {
      if (!this.connected) return

      // Simulate tank level updates
      const stations = [1, 2, 3, 4]
      const station = stations[Math.floor(Math.random() * stations.length)]
      const tankId = Math.floor(Math.random() * 2) + 1 // 1 or 2

      const levelData = {
        stationId: station,
        tankId: tankId,
        level: 50 + Math.random() * 40, // 50-90%
        volume: 8000 + Math.random() * 4000, // 8000-12000L
        temperature: 20 + Math.random() * 10, // 20-30°C
        timestamp: new Date().toISOString(),
      }

      this.handleMessage(`fuel/station/${station}/tank/${tankId}/level`, Buffer.from(JSON.stringify(levelData)))

      // Occasionally simulate alerts
      if (Math.random() < 0.1) {
        const alertData = {
          stationId: station,
          tankId: tankId,
          type: Math.random() > 0.5 ? "low_level" : "temperature",
          severity: Math.random() > 0.7 ? "critical" : "warning",
          message: "Alerte détectée",
          timestamp: new Date().toISOString(),
        }

        this.handleMessage(`fuel/station/${station}/alert`, Buffer.from(JSON.stringify(alertData)))
      }
    }, 5000)
  }

  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString())
      console.log(`MQTT: Message received on ${topic}`, payload)

      // Notify all subscribers for this topic
      const topicSubscribers = this.subscribers.get(topic) || []
      topicSubscribers.forEach((callback) => callback(payload))

      // Notify wildcard subscribers
      const wildcardSubscribers = this.subscribers.get("*") || []
      wildcardSubscribers.forEach((callback) => callback({ topic, payload }))
    } catch (error) {
      console.error("MQTT: Error parsing message", error)
    }
  }

  handleConnectionError(error) {
    this.notifySubscribers("connection", {
      status: "error",
      error: error.message,
    })
  }

  subscribe(topic, callback) {
    if (!this.client) {
      console.error("MQTT: Client not initialized")
      return
    }

    // Add callback to subscribers
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, [])
    }
    this.subscribers.get(topic).push(callback)

    // Subscribe to MQTT topic
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`MQTT: Failed to subscribe to ${topic}`, err)
      } else {
        console.log(`MQTT: Subscribed to ${topic}`)
      }
    })

    // Return unsubscribe function
    return () => this.unsubscribe(topic, callback)
  }

  unsubscribe(topic, callback) {
    const topicSubscribers = this.subscribers.get(topic)
    if (topicSubscribers) {
      const index = topicSubscribers.indexOf(callback)
      if (index > -1) {
        topicSubscribers.splice(index, 1)
      }

      // If no more subscribers, unsubscribe from MQTT
      if (topicSubscribers.length === 0) {
        this.subscribers.delete(topic)
        if (this.client) {
          this.client.unsubscribe(topic)
        }
      }
    }
  }

  publish(topic, message, options = {}) {
    if (!this.client || !this.connected) {
      console.error("MQTT: Not connected")
      return Promise.reject(new Error("Not connected"))
    }

    return new Promise((resolve, reject) => {
      const payload = typeof message === "string" ? message : JSON.stringify(message)

      this.client.publish(topic, payload, options, (err) => {
        if (err) {
          console.error(`MQTT: Failed to publish to ${topic}`, err)
          reject(err)
        } else {
          console.log(`MQTT: Published to ${topic}`)
          resolve()
        }
      })
    })
  }

  notifySubscribers(topic, data) {
    const subscribers = this.subscribers.get(topic) || []
    subscribers.forEach((callback) => callback(data))
  }

  disconnect() {
    if (this.client) {
      this.client.end(true)
      this.client = null
      this.connected = false
      this.subscribers.clear()
      console.log("MQTT: Disconnected")
    }
  }

  isConnected() {
    return this.connected
  }
}

// Export singleton instance
export default new MQTTService()
