<template>
  <div class="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart :data="data" :margin="{ top: 10, right: 10, left: 10, bottom: 0 }">
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" :stopOpacity="0.3" />
            <stop offset="95%" stopColor="#8b5cf6" :stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" :stroke="gridColor" />
        <XAxis
          dataKey="hour"
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
        <Area
          type="monotone"
          dataKey="volume"
          stroke="#8b5cf6"
          fill="url(#volumeGradient)"
          :strokeWidth="2"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</template>

<script setup>
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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