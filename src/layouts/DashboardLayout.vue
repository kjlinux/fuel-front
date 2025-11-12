<template>
  <div class="min-h-screen bg-background">
    <aside :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]">
      <div class="flex items-center gap-3 h-16 px-6 border-b border-border">
        <img src="/cuve_connect.png" alt="Cuve Connect Logo" class="h-10 w-auto object-contain" />
      </div>

      <nav class="p-4 space-y-1">
        <router-link v-for="item in navigation" :key="item.name" :to="item.to" :class="[
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive(item.to)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        ]">
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.name }}</span>
        </router-link>
        </nav>

      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <div class="flex items-center gap-3 px-3 py-2">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">
              {{ authStore.user?.name || 'Utilisateur' }}
            </p>
            <p class="text-xs text-muted-foreground truncate">
              {{ authStore.user?.email }}
            </p>
          </div>
          <button @click="handleLogout" class="p-2 rounded-md hover:bg-accent transition-colors" title="Déconnexion">
            <LogOut class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>

    <div class="md:pl-64">
      <header class="sticky top-0 z-40 h-16 bg-card border-b border-border">
        <div class="flex items-center justify-between h-full px-4 md:px-6">
          <button @click="sidebarOpen = !sidebarOpen"
            class="md:hidden p-2 rounded-md hover:bg-accent transition-colors">
            <Menu class="w-6 h-6" />
          </button>

          <h1 class="text-lg font-semibold text-foreground hidden md:block">
            {{ currentPageTitle }}
          </h1>

          <div class="flex items-center gap-2">
            <button @click="showAlerts = !showAlerts" class="relative p-2 rounded-md hover:bg-accent transition-colors">
              <Bell class="w-5 h-5" />
              <span v-if="alertsStore.unreadCount > 0"
                class="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-destructive rounded-full">
                {{ alertsStore.unreadCount }}
              </span>
            </button>

            <div class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/50">
              <div :class="[
                'w-2 h-2 rounded-full',
                mqttConnected ? 'bg-success' : 'bg-destructive'
              ]" />
              <span class="text-xs font-medium">
                {{ mqttConnected ? 'Connecté' : 'Déconnecté' }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main class="p-4 md:p-6">
        <router-view />
      </main>
    </div>

    <div v-if="sidebarOpen" @click="sidebarOpen = false"
      class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlertsStore } from '@/stores/alerts'
import { useMqtt } from '@/hooks/useMqtt'
import {
  LayoutDashboard,
  Building2,
  Bell,
  FileText,
  Settings,
  Menu,
  LogOut,
  Truck,
  Activity,
  Users
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const alertsStore = useAlertsStore()
const { connected: mqttConnected } = useMqtt()

const sidebarOpen = ref(false)
const showAlerts = ref(false)

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Stations', to: '/stations', icon: Building2 },
  { name: 'Alertes', to: '/alerts', icon: Bell },
  { name: 'Rapports', to: '/reports', icon: FileText },
  { name: 'Dépotages', to: '/deliveries', icon: Truck },
  { name: 'Temps Réel', to: '/realtime', icon: Activity },
  { name: 'Utilisateurs', to: '/users', icon: Users },
  { name: 'Paramètres', to: '/settings', icon: Settings }
]

const currentPageTitle = computed(() => {
  const item = navigation.find(item => item.to === route.path)
  return item?.name || 'Dashboard'
})

const userInitials = computed(() => {
  const name = authStore.user?.name || 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

function isActive(path) {
  return route.path === path
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>
