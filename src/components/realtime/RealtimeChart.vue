<template>
  <div class="space-y-4">
    <!-- Connection Status -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div :class="['w-2 h-2 rounded-full', connectionStatusColor]" />
        <span class="text-sm text-muted-foreground">
          {{ connectionStatusText }}
        </span>
      </div>
      
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity class="w-3 h-3" />
        <span>Mise à jour: {{ lastUpdate }}</span>
      </div>
    </div>

    <!-- Chart -->
    <div class="h-[300px]">
      <v-chart :option="chartOption" autoresize />
    </div>

    <!-- Current Value Display -->
    <div class="flex items-center justify-between p-4 rounded-lg bg-muted/50">
      <div>
        <p class="text-sm text-muted-foreground">Valeur actuelle</p>
        <p class="text-2xl font-bold text-foreground mt-1">
          {{ currentValue }} {{ unit }}
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <component
          :is="trendIcon"
          :class="['w-5 h-5', trendColor]"
        />
        <span :class="['text-sm font-medium', trendColor]">
          {{ trendText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import mqttService from '@/services/mqttService'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent
])

const props = defineProps({
  topic: {
    type: String,
    required: true
  },
  dataKey: {
    type: String,
    default: 'value'
  },
  unit: {
    type: String,
    default: ''
  },
  maxDataPoints: {
    type: Number,
    default: 20
  },
  yDomain: {
    type: Array,
    default: () => ['auto', 'auto']
  }
})

const chartData = ref([])
const currentValue = ref(0)
const lastUpdate = ref('--:--')
const connected = ref(false)
const previousValue = ref(0)

let unsubscribe = null

const connectionStatusColor = computed(() => 
  connected.value ? 'bg-green-500 animate-pulse' : 'bg-red-500'
)

const connectionStatusText = computed(() => 
  connected.value ? 'Connecté - Temps réel' : 'Déconnecté'
)

const trend = computed(() => {
  if (currentValue.value > previousValue.value) return 'up'
  if (currentValue.value < previousValue.value) return 'down'
  return 'stable'
})

const trendIcon = computed(() => {
  if (trend.value === 'up') return TrendingUp
  if (trend.value === 'down') return TrendingDown
  return Minus
})

const trendColor = computed(() => {
  if (trend.value === 'up') return 'text-green-500'
  if (trend.value === 'down') return 'text-red-500'
  return 'text-muted-foreground'
})

const trendText = computed(() => {
  const diff = Math.abs(currentValue.value - previousValue.value)
  if (trend.value === 'stable') return 'Stable'
  return `${trend.value === 'up' ? '+' : '-'}${diff.toFixed(1)} ${props.unit}`
})

const chartOption = computed(() => ({
  grid: {
    top: 20,
    right: 20,
    bottom: 40,
    left: 60,
    containLabel: false
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    borderWidth: 1,
    textStyle: {
      color: 'hsl(var(--foreground))'
    },
    formatter: (params) => {
      const param = params[0]
      return `${param.axisValue}<br/>${param.value.toFixed(2)} ${props.unit}`
    }
  },
  xAxis: {
    type: 'category',
    data: chartData.value.map(d => d.time),
    axisLine: {
      lineStyle: {
        color: 'hsl(var(--border))'
      }
    },
    axisLabel: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 12
    },
    splitLine: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    min: props.yDomain[0] === 'auto' ? null : props.yDomain[0],
    max: props.yDomain[1] === 'auto' ? null : props.yDomain[1],
    axisLine: {
      lineStyle: {
        color: 'hsl(var(--border))'
      }
    },
    axisLabel: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 12
    },
    splitLine: {
      lineStyle: {
        color: 'hsl(var(--border))',
        type: 'dashed'
      }
    }
  },
  series: [
    {
      type: 'line',
      data: chartData.value.map(d => d.value),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: 2,
        color: '#3b82f6'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ]
        }
      }
    }
  ]
}))

function handleMessage(data) {
  const value = data[props.dataKey]
  if (value === undefined) return

  previousValue.value = currentValue.value
  currentValue.value = Number(value.toFixed(2))
  lastUpdate.value = format(new Date(), 'HH:mm:ss')

  // Add to chart data
  chartData.value.push({
    time: format(new Date(), 'HH:mm:ss'),
    value: currentValue.value
  })

  // Keep only last N data points
  if (chartData.value.length > props.maxDataPoints) {
    chartData.value.shift()
  }
}

function handleConnection(status) {
  connected.value = status.status === 'connected'
}

onMounted(() => {
  // Connect to MQTT
  if (!mqttService.isConnected()) {
    mqttService.connect()
  }

  // Subscribe to connection status
  mqttService.subscribe('connection', handleConnection)

  // Subscribe to data topic
  unsubscribe = mqttService.subscribe(props.topic, handleMessage)

  // Set initial connection status
  connected.value = mqttService.isConnected()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  mqttService.unsubscribe('connection', handleConnection)
})
</script>

<style scoped>
.echarts {
  width: 100%;
  height: 100%;
}
</style>