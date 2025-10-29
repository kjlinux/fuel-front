import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/LoginView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/auth/RegisterView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/DashboardLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
        },
        {
          path: "stations",
          name: "stations",
          component: () => import("@/views/StationsView.vue"),
        },
        {
          path: "stations/:id",
          name: "station-detail",
          component: () => import("@/views/StationDetailView.vue"),
        },
        {
          path: "alerts",
          name: "alerts",
          component: () => import("@/views/AlertsView.vue"),
        },
        {
          path: "reports",
          name: "reports",
          component: () => import("@/views/ReportsView.vue"),
        },
        {
          path: "deliveries",
          name: "deliveries",
          component: () => import("@/views/DeliveriesView.vue"),
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("@/views/SettingsView.vue"),
        },
        {
          path: "realtime",
          name: "realtime-monitor",
          component: () => import("@/views/RealtimeMonitorView.vue"),
          // meta: { requiresAuth: true },
        },
        {
          path: "users",
          name: "users",
          component: () => import("@/views/UsersView.vue"),
          // meta: { requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "login" })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: "dashboard" })
  } else {
    next()
  }
})

export default router
