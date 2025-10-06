<template>
  <div class="h-[350px]">
    <v-chart 
      class="chart" 
      :option="chartOption" 
      autoresize
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

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
  const { data, timeLabels } = generateChartData()
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      backgroundColor: 'hsl(var(--card))',
      borderColor: 'hsl(var(--border))',
      borderWidth: 1,
      textStyle: {
        color: 'hsl(var(--foreground))'
      }
    },
    legend: {
      data: props.tanks.map(tank => tank.name),
      bottom: 0,
      textStyle: {
        color: 'hsl(var(--foreground))'
      }
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
      data: timeLabels,
      axisLine: {
        lineStyle: {
          color: 'hsl(var(--border))'
        }
      },
      axisLabel: {
        color: 'hsl(var(--muted-foreground))',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: 'Litres',
      nameTextStyle: {
        color: 'hsl(var(--muted-foreground))'
      },
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
    series: props.tanks.map(tank => ({
      name: tank.name,
      type: 'line',
      smooth: true,
      data: data[tank.name],
      lineStyle: {
        color: getTankColor(tank.type),
        width: 2
      },
      itemStyle: {
        color: getTankColor(tank.type)
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
              color: getTankColor(tank.type) + '4D' // 30% opacity
            },
            {
              offset: 1,
              color: getTankColor(tank.type) + '00' // 0% opacity
            }
          ]
        }
      }
    }))
  }
})

function generateChartData() {
  const now = new Date()
  const timeLabels = []
  const data = {}
  
  let points, interval, formatStr
  
  switch (props.period) {
    case '7j':
      points = 168 // 7 days * 24 hours
      interval = 60 * 60 * 1000 // 1 hour
      formatStr = 'dd/MM HH:mm'
      break
    case '30j':
      points = 720 // 30 days * 24 hours
      interval = 60 * 60 * 1000 // 1 hour
      formatStr = 'dd/MM'
      break
    default: // 24h
      points = 48 // 24 hours * 2 (every 30 min)
      interval = 30 * 60 * 1000 // 30 minutes
      formatStr = 'HH:mm'
  }
  
  // Initialize data arrays for each tank
  props.tanks.forEach(tank => {
    data[tank.name] = []
  })
  
  // Generate time points and data
  for (let i = points; i >= 0; i--) {
    const timestamp = now.getTime() - i * interval
    timeLabels.push(format(new Date(timestamp), formatStr, { locale: fr }))
    
    props.tanks.forEach(tank => {
      // Generate mock historical data with some variation
      const variation = (Math.random() - 0.5) * (tank.capacity * 0.05)
      const value = Math.max(0, Math.min(tank.capacity, tank.level + variation))
      data[tank.name].push(Math.round(value))
    })
  }
  
  return { data, timeLabels }
}

function getTankColor(type) {
  return type === 'essence' ? '#3b82f6' : '#f59e0b'
}
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>