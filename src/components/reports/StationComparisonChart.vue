<template>
  <div class="h-[300px] w-full">
    <v-chart :option="chartOption" autoresize class="w-full h-full" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
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
    axisPointer: {
      type: 'shadow'
    },
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    textStyle: {
      color: 'hsl(var(--foreground))'
    }
  },
  legend: {
    data: ['Essence', 'Gasoil'],
    textStyle: {
      color: 'hsl(var(--foreground))'
    }
  },
  xAxis: {
    type: 'category',
    data: props.data.map(d => d.name),
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
      name: 'Essence',
      type: 'bar',
      data: props.data.map(d => d.essence),
      itemStyle: {
        color: '#4169E1',
        borderRadius: [4, 4, 0, 0]
      }
    },
    {
      name: 'Gasoil',
      type: 'bar',
      data: props.data.map(d => d.gasoil),
      itemStyle: {
        color: '#FF8C42',
        borderRadius: [4, 4, 0, 0]
      }
    }
  ]
}))
</script>
