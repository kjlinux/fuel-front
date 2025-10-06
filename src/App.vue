<template>
  <div id="app">
    <router-view />
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import Toast from '@/components/ui/Toast.vue'
import { ref, onMounted } from 'vue'
import { useAlertsStore } from '@/stores/alerts'

const toastRef = ref(null)
const alertsStore = useAlertsStore()

onMounted(() => {
  // Simulate receiving real-time alerts via MQTT
  const simulateAlerts = setInterval(() => {
    // Random chance of new alert (10% every 30 seconds)
    if (Math.random() < 0.1) {
      const alertTypes = [
        {
          type: 'low_level',
          severity: 'warning',
          message: 'Niveau bas détecté',
          stationId: Math.floor(Math.random() * 4) + 1,
          tankId: Math.floor(Math.random() * 8) + 1
        },
        {
          type: 'temperature',
          severity: 'warning',
          message: 'Température élevée',
          stationId: Math.floor(Math.random() * 4) + 1,
          tankId: Math.floor(Math.random() * 8) + 1
        }
      ]
      
      const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      const newAlert = alertsStore.addAlert(randomAlert)
      
      // Show toast notification
      if (toastRef.value) {
        toastRef.value.addToast({
          title: 'Nouvelle alerte',
          message: newAlert.message,
          variant: newAlert.severity === 'critical' ? 'error' : 'warning',
          duration: 6000
        })
      }
    }
  }, 30000) // Check every 30 seconds
  
  // Cleanup on unmount
  return () => clearInterval(simulateAlerts)
})
</script>
