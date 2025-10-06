<template>
  <v-chart 
    class="chart" 
    :option="chartOption" 
    autoresize
  />
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// Enregistrer les composants ECharts nécessaires
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const props = defineProps({
  tanks: {
    type: Array,
    required: true
  },
  period: {
    type: String,
    default: '24h'
  }
})

const chartOption = computed(() => {
  const timeLabels = generateTimeLabels(props.period)
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: props.tanks.map(tank => tank.type),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeLabels
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: props.tanks.map(tank => ({
      name: tank.type,
      type: 'line',
      smooth: true,
      data: generateMockData(tank.percentage, timeLabels.length),
      lineStyle: {
        color: getTankColor(tank.percentage),
        width: 2
      },
      itemStyle: {
        color: getTankColor(tank.percentage)
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: getTankColor(tank.percentage) + '40'
            },
            {
              offset: 1,
              color: getTankColor(tank.percentage) + '00'
            }
          ]
        }
      }
    }))
  }
})

function generateTimeLabels(period) {
  const count = period === '24h' ? 24 : period === '7d' ? 7 : 30
  return Array.from({ length: count }, (_, i) => {
    if (period === '24h') return `${i}h`
    if (period === '7d') return `Jour ${i + 1}`
    return `J${i + 1}`
  })
}

function generateMockData(currentPercentage, count) {
  const data = []
  let value = currentPercentage
  
  for (let i = 0; i < count; i++) {
    // Variation aléatoire plus réaliste
    const change = (Math.random() - 0.5) * 8
    value = Math.max(0, Math.min(100, value + change))
    data.push(Math.round(value * 10) / 10)
  }
  
  return data
}

function getTankColor(percentage) {
  if (percentage >= 70) return '#22c55e'
  if (percentage >= 30) return '#f59e0b'
  return '#ef4444'
}
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>