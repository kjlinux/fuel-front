<template>
  <div class="h-[300px] flex items-center justify-center">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          :data="data"
          cx="50%"
          cy="50%"
          :label-line="false"
          :label="renderCustomLabel"
          :outer-radius="100"
          fill="#8884d8"
          data-key="value"
        >
          <template v-for="(entry, index) in data" :key="`cell-${index}`">
            <Cell :fill="entry.color" />
          </template>
        </Pie>
        <Tooltip
          :content-style="{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }"
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
</template>

<script setup>
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { h } from 'vue'

defineProps({
  data: {
    type: Array,
    required: true
  }
})

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180)
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180)

  return h('text', {
    x: x,
    y: y,
    fill: 'white',
    textAnchor: x > cx ? 'start' : 'end',
    dominantBaseline: 'central',
    style: { fontSize: '14px', fontWeight: 'bold' }
  }, `${(percent * 100).toFixed(0)}%`)
}
</script>
