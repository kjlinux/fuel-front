<template>
  <div class="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart :data="data" :margin="{ top: 5, right: 10, left: 10, bottom: 5 }">
        <CartesianGrid strokeDasharray="3 3" :stroke="gridColor" />
        <XAxis
          dataKey="name"
          :stroke="axisColor"
          :tick="{ fill: axisColor, fontSize: 12 }"
        />
        <YAxis
          :stroke="axisColor"
          :tick="{ fill: axisColor, fontSize: 12 }"
          :label="{ value: 'Litres', angle: -90, position: 'insideLeft', fill: axisColor }"
        />
        <Tooltip
          :contentStyle="{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }"
        />
        <Legend />
        <Bar dataKey="essence" fill="#3b82f6" name="Essence" :radius="[4, 4, 0, 0]" />
        <Bar dataKey="gasoil" fill="#f59e0b" name="Gasoil" :radius="[4, 4, 0, 0]" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</template>

<script setup>
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

defineProps({
  data: {
    type: Array,
    required: true
  }
})

const gridColor = 'hsl(var(--border))'
const axisColor = 'hsl(var(--muted-foreground))'
</script>