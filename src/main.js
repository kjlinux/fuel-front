import { createApp } from "vue"
import { createPinia } from "pinia"
import router from "./router"
import App from "./App.vue"
import "./assets/globals.css"

import ECharts from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const app = createApp(App)
const pinia = createPinia()

app.component('v-chart', ECharts)

app.use(pinia)
app.use(router)
app.mount("#app")