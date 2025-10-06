<template>
  <div class="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart :data="data" :margin="{ top: 5, right: 10, left: 10, bottom: 5 }">
        <CartesianGrid strokeDasharray="3 3" :stroke="gridColor" />
        <XAxis
          dataKey="date"
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
        <Line
          type="monotone"
          dataKey="essence"
          stroke="#3b82f6"
          :strokeWidth="2"
          :dot="{ r: 3 }"
          name="Essence"
        />
        <Line
          type="monotone"
          dataKey="gasoil"
          stroke="#f59e0b"
          :strokeWidth="2"
          :dot="{ r: 3 }"
          name="Gasoil"
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</template>

<script setup>
import {
  LineChart,
  Line,
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