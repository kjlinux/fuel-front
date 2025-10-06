<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-border">
          <th class="text-left py-3 px-4 text-sm font-semibold text-foreground">Station</th>
          <th class="text-right py-3 px-4 text-sm font-semibold text-foreground">Volume total</th>
          <th class="text-right py-3 px-4 text-sm font-semibold text-foreground">Revenus</th>
          <th class="text-right py-3 px-4 text-sm font-semibold text-foreground">Moy. journalière</th>
          <th class="text-right py-3 px-4 text-sm font-semibold text-foreground">Alertes</th>
          <th class="text-right py-3 px-4 text-sm font-semibold text-foreground">Disponibilité</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in data"
          :key="index"
          class="border-b border-border hover:bg-accent/50 transition-colors"
        >
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-500" />
              <span class="text-sm font-medium text-foreground">{{ row.station }}</span>
            </div>
          </td>
          <td class="text-right py-3 px-4 text-sm text-foreground">
            {{ formatVolume(row.totalVolume) }} L
          </td>
          <td class="text-right py-3 px-4 text-sm text-foreground">
            {{ formatCurrency(row.revenue) }}
          </td>
          <td class="text-right py-3 px-4 text-sm text-foreground">
            {{ formatVolume(row.avgDaily) }} L
          </td>
          <td class="text-right py-3 px-4">
            <Badge :variant="row.alerts > 5 ? 'destructive' : row.alerts > 2 ? 'warning' : 'default'">
              {{ row.alerts }}
            </Badge>
          </td>
          <td class="text-right py-3 px-4">
            <div class="flex items-center justify-end gap-2">
              <div class="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  :class="['h-full rounded-full', getUptimeColor(row.uptime)]"
                  :style="{ width: `${row.uptime}%` }"
                />
              </div>
              <span class="text-sm font-medium text-foreground">{{ row.uptime }}%</span>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-border bg-muted/30">
          <td class="py-3 px-4 text-sm font-bold text-foreground">Total</td>
          <td class="text-right py-3 px-4 text-sm font-bold text-foreground">
            {{ formatVolume(totalVolume) }} L
          </td>
          <td class="text-right py-3 px-4 text-sm font-bold text-foreground">
            {{ formatCurrency(totalRevenue) }}
          </td>
          <td class="text-right py-3 px-4 text-sm font-bold text-foreground">
            {{ formatVolume(avgDaily) }} L
          </td>
          <td class="text-right py-3 px-4 text-sm font-bold text-foreground">
            {{ totalAlerts }}
          </td>
          <td class="text-right py-3 px-4 text-sm font-bold text-foreground">
            {{ avgUptime.toFixed(1) }}%
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const totalVolume = computed(() => props.data.reduce((sum, row) => sum + row.totalVolume, 0))
const totalRevenue = computed(() => props.data.reduce((sum, row) => sum + row.revenue, 0))
const avgDaily = computed(() => props.data.reduce((sum, row) => sum + row.avgDaily, 0))
const totalAlerts = computed(() => props.data.reduce((sum, row) => sum + row.alerts, 0))
const avgUptime = computed(() => props.data.reduce((sum, row) => sum + row.uptime, 0) / props.data.length)

function formatVolume(volume) {
  return new Intl.NumberFormat('fr-FR').format(volume)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function getUptimeColor(uptime) {
  if (uptime >= 99) return 'bg-green-500'
  if (uptime >= 95) return 'bg-orange-500'
  return 'bg-red-500'
}
</script>
