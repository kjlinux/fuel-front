<template>
  <div class="h-[300px] w-full flex items-center justify-center">
    <v-chart :option="chartOption" autoresize class="w-full h-full" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    textStyle: {
      color: 'hsl(var(--foreground))'
    },
    formatter: '{b}: {c} L ({d}%)'
  },
  legend: {
    bottom: 10,
    textStyle: {
      color: 'hsl(var(--foreground))'
    }
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        formatter: '{d}%',
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
      },
      labelLine: {
        show: false
      },
      data: props.data.map(item => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: item.color
        }
      }))
    }
  ]
}))
</script>
