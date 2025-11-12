<template>
  <aside class="w-64 bg-card border-r border-border flex flex-col h-screen">
    <!-- Logo -->
    <div class="p-6 border-b border-border">
      <div class="flex items-center gap-3">
        <img src="/cuve_connect.png" alt="Cuve Connect Logo" class="h-10 w-auto object-contain" />
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
        active-class="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="font-medium">{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- User Profile -->
    <div class="p-4 border-t border-border">
      <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
          A
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground truncate">Admin User</p>
          <p class="text-xs text-muted-foreground truncate">admin@fueliot.com</p>
        </div>
        <button
          @click="logout"
          class="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          title="Déconnexion"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LayoutDashboard, Building2, Bell, BarChart3, Truck, Activity, Settings, Users, LogOut } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// Navigation menu items
const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Stations', icon: Building2, path: '/stations' },
  { name: 'Alertes', icon: Bell, path: '/alerts' },
  { name: 'Rapports', icon: BarChart3, path: '/reports' },
  { name: 'Dépotages', icon: Truck, path: '/deliveries' },
  { name: 'Temps Réel', icon: Activity, path: '/realtime' },
  { name: 'Utilisateurs', icon: Users, path: '/users' },
  { name: 'Paramètres', icon: Settings, path: '/settings' }
]

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
