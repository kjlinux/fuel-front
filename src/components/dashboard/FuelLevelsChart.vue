<template>
  <div class="h-[300px]">
    <v-chart :option="chartOption" autoresize />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const chartData = computed(() => {
  return props.data.map(point => ({
    time: format(new Date(point.timestamp), 'HH:mm', { locale: fr }),
    essence: Math.round(point.essence),
    gasoil: Math.round(point.gasoil)
  }))
})

const chartOption = computed(() => ({
  grid: {
    top: 50,
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
      let result = `${params[0].axisValue}<br/>`
      params.forEach(param => {
        result += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${param.color};margin-right:5px;"></span>`
        result += `${param.seriesName}: ${param.value} L<br/>`
      })
      return result
    }
  },
  legend: {
    data: ['Essence', 'Gasoil'],
    top: 10,
    textStyle: {
      color: 'hsl(var(--foreground))'
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
    name: 'Litres',
    nameTextStyle: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 12
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
  series: [
    {
      name: 'Essence',
      type: 'line',
      data: chartData.value.map(d => d.essence),
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
    },
    {
      name: 'Gasoil',
      type: 'line',
      data: chartData.value.map(d => d.gasoil),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: 2,
        color: '#f59e0b'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245, 158, 11, 0.2)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
          ]
        }
      }
    }
  ]
}))
</script>

<style scoped>
.echarts {
  width: 100%;
  height: 100%;
}
</style>