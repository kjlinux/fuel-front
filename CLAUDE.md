# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FuelIoT is an IoT platform for real-time fuel monitoring in gas stations with automatic leak and theft detection. Built with Vue 3, it features real-time MQTT communication, interactive dashboards, alert management, and comprehensive reporting.

**Key Technologies:**
- Vue 3 (Composition API) + Vite
- Pinia for state management
- Vue Router with route guards
- Tailwind CSS v4 with OKLCH color system
- ECharts (vue-echarts) for data visualization
- MQTT.js for real-time IoT communication
- date-fns for date handling

## Development Commands

```bash
# Development server (http://localhost:5173)
pnpm run dev

# Production build (outputs to dist/)
pnpm run build

# Preview production build
pnpm run preview
```

## Application Architecture

### State Management (Pinia Stores)

The application uses Pinia stores located in [src/stores/](src/stores/):

- **auth.js** - Authentication, user roles (super_admin, admin, manager), JWT token management
- **stations.js** - Station and tank data management, level updates
- **alerts.js** - Alert creation, resolution, filtering by severity/type

All stores currently use mock/simulated data. When connecting to a real backend API, replace the simulated responses in store actions.

### MQTT Integration

Two MQTT implementations exist:

1. **[src/services/mqttService.js](src/services/mqttService.js)** - Singleton service with simulated MQTT client for demo mode
2. **[src/hooks/useMqtt.js](src/hooks/useMqtt.js)** - Composable that handles real MQTT connections via mqtt.js library

**Topic Structure:**
- `station/{stationId}/tank/{tankId}/level` - Tank fuel levels
- `station/{stationId}/tank/{tankId}/alert` - Tank-specific alerts
- `station/{stationId}/status` - Station status

The system automatically falls back to simulated data when MQTT is unavailable or `VITE_MQTT_ENABLED=false`.

### Routing & Navigation

Routes are defined in [src/router/index.js](src/router/index.js):

- **Public routes:** `/login`, `/register`
- **Protected routes:** All routes under `/` use [DashboardLayout.vue](src/layouts/DashboardLayout.vue)
- **Route guards:** `requiresAuth` checks authentication, `requiresAdmin` restricts to admin users

Main views:
- `/` - Dashboard with stats and station overview
- `/stations` - Station list, `/stations/:id` - Station detail with tanks
- `/alerts` - Alert management with filtering
- `/reports` - Analytics and data export (PDF/Excel/CSV)
- `/realtime` - Real-time MQTT monitoring
- `/users` - User management (admin only)

### Component Organization

Components are organized by feature in [src/components/](src/components/):

- **ui/** - Reusable UI primitives (Button, Card, Badge, Input, Select, Toast, CircularGauge)
- **layout/** - Sidebar navigation
- **dashboard/** - Stats cards, fuel level charts, station lists, maps, recent alerts
- **stations/** - Station cards, tank cards with circular gauges, tank history charts, dialogs for CRUD
- **alerts/** - Alert cards, detail dialogs
- **reports/** - Consumption trends, station comparison, peak hours, fuel type breakdown
- **realtime/** - Real-time charts and tank level displays

### Styling System

Tailwind CSS v4 with custom design tokens in [src/assets/globals.css](src/assets/globals.css):

- Uses OKLCH color space for perceptually uniform colors
- Color semantic tokens: `--primary`, `--secondary`, `--accent`, `--destructive`, `--success`, `--warning`, `--info`
- Chart colors: `--chart-1` through `--chart-5` (petroleum industry themed palette)
- All colors defined in both CSS variables and Tailwind utility classes
- Border radius: `--radius` (0.75rem default)

To modify colors, edit the `:root` variables in globals.css. The system automatically maps to Tailwind classes.

### Data Flow Patterns

**Real-time updates:**
1. MQTT messages received in mqttService or useMqtt composable
2. Parse topic to extract stationId and tankId
3. Call store methods (e.g., `stationsStore.updateTankLevel()`, `alertsStore.addAlert()`)
4. Vue reactivity updates all components using that data

**API integration points:**
- Store actions marked with `// Simulate API call` comments
- Replace `await new Promise(setTimeout)` with actual API calls to backend
- API base URL configured via `VITE_API_URL` environment variable

### Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# MQTT Configuration
VITE_MQTT_ENABLED=false              # Set to 'true' for real MQTT
VITE_MQTT_BROKER_URL=ws://localhost:9001
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=

# API Backend
VITE_API_URL=http://localhost:3000/api
```

**Simulation Mode (default):** When `VITE_MQTT_ENABLED=false`, the app uses mock data with simulated updates every 5-10 seconds.

**Production Mode:** Set `VITE_MQTT_ENABLED=true` and configure a real MQTT broker (see [MQTT_INTEGRATION.md](MQTT_INTEGRATION.md) for detailed setup).

## Common Development Patterns

### Adding a New View

1. Create component in [src/views/](src/views/)
2. Add route in [src/router/index.js](src/router/index.js) with appropriate meta flags
3. Add navigation link in [src/components/layout/Sidebar.vue](src/components/layout/Sidebar.vue)

### Creating a New Chart Component

Use ECharts via the global `v-chart` component (registered in [main.js](src/main.js)):

```vue
<template>
  <v-chart :option="chartOption" style="height: 300px" />
</template>

<script setup>
import { ref } from 'vue'

const chartOption = ref({
  // ECharts configuration object
  xAxis: { type: 'category', data: [...] },
  yAxis: { type: 'value' },
  series: [{ data: [...], type: 'line' }]
})
</script>
```

Only import what's needed from echarts/core. Components and renderers are registered globally in main.js: `CanvasRenderer`, `LineChart`, `BarChart`, `TitleComponent`, `TooltipComponent`, `LegendComponent`, `GridComponent`.

### Working with Stores

Use the Composition API pattern:

```vue
<script setup>
import { useStationsStore } from '@/stores/stations'
import { onMounted } from 'vue'

const stationsStore = useStationsStore()

onMounted(() => {
  stationsStore.fetchStations()
})
</script>
```

### Path Aliasing

`@/` is aliased to `src/` in [vite.config.js](vite.config.js). Always use `@/` for imports:
- `import { Button } from '@/components/ui/Button.vue'`
- `import { useAuthStore } from '@/stores/auth'`

## Testing & Debugging

### MQTT Testing

Use mosquitto clients or MQTT Explorer to publish test messages:

```bash
# Publish tank level update
mosquitto_pub -h localhost -t "station/1/tank/1/level" \
  -m '{"level": 75, "volume": 7500, "temperature": 22}'

# Publish alert
mosquitto_pub -h localhost -t "station/1/alert" \
  -m '{"type": "low_level", "severity": "warning", "tankId": 1}'
```

See [MQTT_INTEGRATION.md](MQTT_INTEGRATION.md) for complete topic schemas and message formats.

## Important Notes

- **Authentication:** Currently uses mock JWT. In production, implement real backend authentication and store tokens securely.
- **Admin Role Checking:** The `/users` route requires `requiresAdmin: true` but admin role checking logic is minimal. Expand role-based access control as needed.
- **MQTT Security:** In production, always use WSS (WebSocket Secure) with TLS/SSL and implement proper authentication/ACL.
- **Data Persistence:** All data is in-memory. Implement backend API for persistent storage.
- **Alert Thresholds:** Alert detection logic (low level, anomalies) should be implemented in backend or IoT devices, not frontend.
