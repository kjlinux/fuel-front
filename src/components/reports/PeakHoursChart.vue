<template>
  <div class="h-[300px] w-full">
    <v-chart :option="chartOption" autoresize class="w-full h-full" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  CanvasRenderer
])

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const chartOption = computed(() => ({
  grid: {
    left: '50',
    right: '20',
    top: '20',
    bottom: '30',
    containLabel: false
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    textStyle: {
      color: 'hsl(var(--foreground))'
    },
    formatter: '{b}h: {c} L'
  },
  xAxis: {
    type: 'category',
    data: props.data.map(d => d.hour),
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
    nameLocation: 'middle',
    nameGap: 40,
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
  series: [
    {
      type: 'line',
      data: props.data.map(d => d.volume),
      smooth: true,
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
              color: 'rgba(65, 105, 225, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(65, 105, 225, 0)'
            }
          ]
        }
      },
      lineStyle: {
        width: 3,
        color: '#4169E1'
      },
      itemStyle: {
        color: '#4169E1'
      }
    }
  ]
}))
</script>
